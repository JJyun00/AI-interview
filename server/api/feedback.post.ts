import Anthropic from "@anthropic-ai/sdk";
import { Readable } from "node:stream";

export default defineEventHandler(async (event) => {
    const body = await readBody(event)

    if (!body) {
        throw createError({statusCode: 400, statusMessage: 'Bad Request', message: '요청 본문이 비어 있습니다.'})
    }
    if (typeof body.job !== 'string' || typeof body.content !== 'string') {
        throw createError({statusCode: 400, statusMessage: 'Bad Request', message: '직무와 내용의 타입이 문자열이 아닙니다.'})
    }
    if (!body.job.trim()) {
        throw createError({statusCode: 400, statusMessage: 'Bad Request', message: '지원 직무 값이 비어 있습니다.'})
    }
    if (!body.content.trim()) {
        throw createError({statusCode: 400, statusMessage: 'Bad Request', message: '이력서/글 내용이 비어 있습니다.'})
    }
    if (body.job.length > 20) {
       throw createError({statusCode: 400, statusMessage: 'Bad Request', message: '지원 직무는 20자 이하로 작성해 주세요.'})
    }
    if (body.content.length > 5000) {
        throw createError({statusCode: 400, statusMessage: 'Bad Request', message: '5,000자 이하로 작성해 주세요.'})
    }

    const content = `너는 신입 개발자 면접관이야. 면접관으로서 면접자인 나의 이력서/글을 읽고 피드백을 해줘. 2 문장으로 답하고 마무리는 질문으로.
                     지원 직무: ${body.job}, 이력서/글: ${body.content}`

    const client = new Anthropic() // 환경 변수 ANTHROPIC_API_KEY를 자동으로 읽음
    const stream = client.messages
    .stream({
        model: 'claude-haiku-5-5',
        max_tokens: 500,
        messages: [
            {role: 'user', content: content},
        ],
    })

    async function* textChunks() { // function* 앞에 async가 붙은 함수는 값을 return 하는 대신 yield로 하나씩 내보낼 수 있음
        for await (const chunk of stream) {
            if (chunk.type === "content_block_delta" && chunk.delta.type === "text_delta") {
                // process.stdout.write(chunk.delta.text);
                yield chunk.delta.text // 멈추고 값을 내보냄: 읽는 쪽이 다음 값을 요청하면 멈춘 자리에서 이어서 실행
            }

            if (chunk.type === "message_delta") {
                // max_tokens 한도 도달하여 응답이 잘린 경우
                if (chunk.delta?.stop_reason === "max_tokens") {
                    console.log("Response was cut off at token limit")
                }

                // Claude의 응답 거부
                if (chunk.delta?.stop_reason === "refusal") {
                    console.log("Claude was unable to process this request")
                }
            }
        }
    }

    setHeader(event, 'content-type', 'text/plain; charset=utf-8')
    setHeader(event, 'x-content-type-options', 'nosniff') // 브로우저에서 문장이 한번에 출력되지 않도록 헤더 추가
    return Readable.from(textChunks()) // next() 를 부르는 역할
})
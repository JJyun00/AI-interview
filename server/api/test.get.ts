import Anthropic from "@anthropic-ai/sdk";
import { Readable } from "node:stream";

export default defineEventHandler(async (event) => {
    const client = new Anthropic() // 환경 변수 ANTHROPIC_API_KEY를 자동으로 읽음

    const stream = client.messages
    .stream({
        model: 'claude-haiku-5-5',
        max_tokens: 200,
        messages: [
            {role: 'user', content: '너는 신입 개발자 면접관이야. 면접관으로서 면접자에게 첫 인사를 한 문장으로 해줘. 그리고 질문으로 끝내줘.'},
        ],
    })

    async function* textChunks() { // function* 앞에 async가 붙은 함수는 값을 return 하는 대신 yield로 하나씩 내보낼 수 있음
        for await (const chunk of stream) {
            if (chunk.type === "content_block_delta" && chunk.delta.type === "text_delta") {
                // process.stdout.write(chunk.delta.text);
                yield chunk.delta.text // 내부적으로 next(), Promise 처리를 자동화
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
    return Readable.from(textChunks())
})
import Anthropic from "@anthropic-ai/sdk";

export default defineEventHandler(async () => {
    const client = new Anthropic() // 환경 변수 ANTHROPIC_API_KEY를 자동으로 읽음

    const message = await client.messages.create({
        model: 'claude-haiku-5-5',
        max_tokens: 200,
        messages: [
            {role: 'user', content: '너는 신입 개발자 면접관이야. 면접관으로서 면접자에게 첫 인사를 한 문장으로 해줘.'},
        ],
    })

    const block = message.content[0]
    return {text: block?.type === 'text' ? block.text : ''}
})
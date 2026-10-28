<template>
  <main class="page">
    <h1>AI 면접관</h1>
    <p class="sub">신입 개발자 모의 면접</p>

    <section class="chat">
      <div class="bubble interviewer">
        <span class="name">면접관</span>
        <p class="text">{{ text || '아래 버튼을 누르면 면접관이 인사합니다.' }}</p>
      </div>
      <p v-if="error" class="error">{{ error }}</p>
    </section>

    <button class="start" type="button" :disabled="loading" @click="start">
      {{ loading ? '답변 받는 중...' : '면접관 인사 받기' }}
    </button>
  </main>
</template>

<script setup lang="ts">
const text = ref('')
const loading = ref(false)
const error = ref('')

async function start() {
  loading.value = true
  error.value = ''
  text.value = ''
  
  try {
    const res = await fetch('/api/test')
    if (!res.ok || !res.body) {
      throw new Error(`요청 실패 (${res.status})`)
    }

    const reader = res.body.getReader()
    const decoder = new TextDecoder()

    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      text.value += decoder.decode(value, { stream: true })
    }
  } catch (e) {
    error.value = e instanceof Error ? e.message : '알 수 없는 오류'
  } finally {
    loading.value = false
  }
}
</script>

<style>
* {
  box-sizing: border-box;
}

body {
  margin: 0;
  background: #f5f6f8;
  color: #1c1f26;
  font-family: system-ui, -apple-system, 'Apple SD Gothic Neo', 'Malgun Gothic', sans-serif;
  line-height: 1.6;
}

.page {
  max-width: 640px;
  margin: 0 auto;
  padding: 48px 20px;
}

h1 {
  margin: 0;
  font-size: 1.8rem;
}

.sub {
  margin: 4px 0 28px;
  color: #6b7280;
}

.chat {
  min-height: 160px;
  padding: 20px;
  background: #fff;
  border: 1px solid #e3e6eb;
  border-radius: 12px;
}

.bubble {
  max-width: 90%;
  padding: 12px 16px;
  border-radius: 12px;
}

.bubble.interviewer {
  background: #eef2ff;
}

.name {
  display: block;
  margin-bottom: 4px;
  font-size: 0.8rem;
  font-weight: 600;
  color: #4f46e5;
}

.text {
  margin: 0;
  white-space: pre-wrap;
}

.start {
  margin-top: 20px;
  padding: 12px 20px;
  font: inherit;
  font-weight: 600;
  color: #fff;
  background: #4f46e5;
  border: 0;
  border-radius: 8px;
  cursor: pointer;
}

.start:disabled {
  background: #a5a8c9;
  cursor: not-allowed;
}

.error {
  margin: 12px 0 0;
  color: #b91c1c;
}
</style>
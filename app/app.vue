<template>
  <main class="page">
    <h1>AI 면접관</h1>
    <p class="sub">신입 개발자 모의 면접</p>

    <section class="card form">
      <div class="field">
        <label for="job">지원 직무</label>
        <select id="job" class="control" v-model="selectedJobOption">
          <option key="" value="" disabled selected>직무를 선택하세요</option>
          <option v-for="job in jobOption" :key="job.key" :value="job.value">{{ job.value }}</option>
        </select>
      </div>

      <div class="field" v-if="selectedJobOption === '기타'">
        <label for="job-etc">직무 직접 입력</label>
        <input id="job-etc" class="control" type="text" placeholder="20자 이내 작성" v-model="jobOptionText" maxlength="20" />
      </div>

      <div class="field">
        <label for="content">이력서 / 글</label>
        <textarea
          id="content"
          class="control area"
          rows="12"
          maxlength="5000"
          placeholder="이력서나 자기소개서, 포트폴리오 설명 등을 붙여 넣으세요."
          v-model="content"
        ></textarea>
        <p class="hint">{{ content.length }} / 5,000자</p>
      </div>

      <button class="start" type="button" :disabled="loading || selectedJobOption === '' || (selectedJobOption === '기타' && jobOptionText === '') || content.length === 0" @click="start">
        {{ loading ? '답변 받는 중...' : '면접관에게 보내기' }}
      </button>
    </section>

    <section class="card result">
      <div class="bubble interviewer">
        <span class="name">면접관</span>
        <p class="text">{{ text || '글을 보내면 면접관의 답변이 여기에 표시됩니다.' }}</p>
      </div>

      <div v-if="loading" class="loading" role="status">
        <span class="spinner" aria-hidden="true"></span>
        <span>답변을 생성하는 중...</span>
      </div>

      <p v-if="error" class="error">{{ error }}</p>
    </section>
  </main>
</template>

<script setup lang="ts">
const text = ref('')
const loading = ref(false)
const error = ref('')
const jobOption = ref([
  {key: '백엔드', value: '백엔드'},
  {key: '프론트엔드', value: '프론트엔드'},
  {key: '풀스택', value: '풀스택'},
  {key: '모바일', value: '모바일'},
  {key: '데이터/AI', value: '데이터/AI'},
  {key: 'DevOps', value: 'DevOps'},
  {key: '기타', value: '기타'}
])
const selectedJobOption = ref('')
const jobOptionText = ref('')
const content = ref('')

async function start() {
  loading.value = true
  error.value = ''
  text.value = ''

  // 사용자 이력서/글 전송
  try {
    const res = await fetch('/api/feedback', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        job: selectedJobOption.value === '기타' ? jobOptionText.value : selectedJobOption.value,
        content: content.value
      })
    })
    if (!res.ok || !res.body) {
      const errorData = await res.json()
      console.log('res: ', errorData)
      throw new Error(`요청 실패 (${errorData.statusCode} : ${errorData.message})`)
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

.card {
  padding: 20px;
  background: #fff;
  border: 1px solid #e3e6eb;
  border-radius: 12px;
}

.result {
  margin-top: 20px;
  min-height: 160px;
}

.field {
  margin-bottom: 18px;
}

.field label {
  display: block;
  margin-bottom: 6px;
  font-size: 0.9rem;
  font-weight: 600;
}

.control {
  width: 100%;
  padding: 10px 12px;
  font: inherit;
  color: inherit;
  background: #fff;
  border: 1px solid #d5d9e0;
  border-radius: 8px;
}

.control:focus {
  outline: 2px solid #c7caf5;
  border-color: #4f46e5;
}

.area {
  min-height: 220px;
  resize: vertical;
}

.hint {
  margin: 6px 0 0;
  font-size: 0.8rem;
  text-align: right;
  color: #6b7280;
}

.start {
  width: 100%;
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

.loading {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 14px;
  color: #6b7280;
  font-size: 0.9rem;
}

.spinner {
  width: 18px;
  height: 18px;
  border: 3px solid #d8dbf5;
  border-top-color: #4f46e5;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@media (prefers-reduced-motion: reduce) {
  .spinner {
    animation-duration: 2s;
  }
}

.error {
  margin: 12px 0 0;
  color: #b91c1c;
}
</style>
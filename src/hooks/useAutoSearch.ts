import { ref } from 'vue'

export function useAutoSearch(getParams: () => any, request: (signal?: AbortSignal) => Promise<void>, delay = 400) {
  const timer = ref<number | null>(null)
  let lastKey = ''
  let controller: AbortController | null = null
  const trigger = () => {
    if (timer.value) {
      clearTimeout(timer.value)
      timer.value = null
    }
    timer.value = window.setTimeout(async () => {
      const params = getParams()
      const key = JSON.stringify(params || {})
      if (key === lastKey) return
      lastKey = key
      if (controller) controller.abort()
      controller = new AbortController()
      try {
        await request(controller.signal)
      } catch {}
    }, delay)
  }
  return { trigger }
}


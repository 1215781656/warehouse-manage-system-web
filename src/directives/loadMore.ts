import type { ObjectDirective } from 'vue'

const loadMore: ObjectDirective = {
  mounted(el, binding) {
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        binding.value()
      }
    }, {
      root: null,
      threshold: 0.1
    })

    ;(el as any)._observer = observer
    observer.observe(el)
  },
  unmounted(el) {
    if ((el as any)._observer) {
      (el as any)._observer.disconnect()
      delete (el as any)._observer
    }
  }
}

export default loadMore

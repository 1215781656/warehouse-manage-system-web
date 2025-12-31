import { mount } from '@vue/test-utils'
import GeneralFileUpload from '../GeneralFileUpload.vue'

describe('GeneralFileUpload', () => {
  it('renders file list', () => {
    const wrapper = mount(GeneralFileUpload, {
      props: {
        modelValue: [{ id: '1', refId: 'r1', path: 'finance/attachments/other/f1.pdf', uploadedAt: new Date().toISOString(), originalName: 'f1.pdf', mimeType: 'application/pdf' }],
        recordType: 'receivable',
        recordId: 'r1',
        readonly: true
      }
    })
    expect(wrapper.findAll('.file-item').length).toBe(1)
  })
})


import { mount } from '@vue/test-utils'
import TaxInvoiceUpload from '../TaxInvoiceUpload.vue'

describe('TaxInvoiceUpload', () => {
  it('renders attachments grid', () => {
    const wrapper = mount(TaxInvoiceUpload, {
      props: {
        modelValue: [{ id: '1', refId: 'r1', path: 'finance/attachments/tax/f1.jpg', uploadedAt: new Date().toISOString() }],
        recordType: 'receivable',
        recordId: 'r1',
        readonly: true
      }
    })
    expect(wrapper.findAll('.thumb-item').length).toBe(1)
  })
})


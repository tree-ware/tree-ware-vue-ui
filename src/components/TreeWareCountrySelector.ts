import TreeWareSelect from '@/tree-ware-vue-ui/src/components/TreeWareSelect.vue'
import {
  countryIsoCodes,
  getCountryName,
  getUnicodeFlag
} from '@/tree-ware-vue-ui/src/utilities/country'
import 'reflect-metadata'
import { Component, Prop, PropSync, Vue } from 'vue-property-decorator'

// NOTE: properties are ISO country-codes.

@Component({
  components: {
    TreeWareSelect
  }
})
export default class TreeWareCountrySelector extends Vue {
  @PropSync('selected') syncedSelected!: string
  @Prop({ default: countryIsoCodes }) readonly countries!: string[]

  getDisplayName(countryCode: string): string {
    if (countryCode === '') return ''
    return `${getUnicodeFlag(countryCode)} ${getCountryName(countryCode)}`
  }

  isExactMatch(searchText: string, option: string): boolean {
    return searchText.toLowerCase() === getCountryName(option).toLowerCase()
  }
}

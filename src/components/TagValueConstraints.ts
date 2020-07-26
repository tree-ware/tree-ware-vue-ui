export interface TagValueConstraints {
  /** Function that returns vee-validate rules for the value field */
  rulesGetter: TagSpecificStringGetter

  /** Function that returns hint text to be shown below the value field */
  hintGetter: TagSpecificStringGetter
}

/** Function that returns a tag-specific string */
export type TagSpecificStringGetter = (tagKey: string) => string

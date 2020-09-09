import _Vue from 'vue'
import Router, { Location } from 'vue-router'
import { Dictionary, ErrorHandler } from 'vue-router/types/router'
import { partition } from '../utilities/array'

const OTHER = '_other'

export type QueryParameterValue = string | (string | null)[]

export interface TreeWareUrlQueryParameterConfig {
  get: () => QueryParameterValue
  set: (value: QueryParameterValue) => void
  /** Reset the state to its default value */
  reset: () => void
}

export interface TreeWareUrlServiceConfig<P extends TreeWareUrlQueryConfig> {
  router: Router
  queryParameters: P
}

export function TreeWareUrlServicePlugin<P extends TreeWareUrlQueryConfig>(
  Vue: typeof _Vue,
  options: TreeWareUrlServiceConfig<P>
) {
  Vue.prototype.$treeWareUrlService = new TreeWareUrlService(
    options.router,
    options.queryParameters
  )
}

export enum TreeWareUrlOtherQueryParameters {
  asIs = 'as-is',
  reset = 'reset'
}

export type TreeWareUrlQuerySpec<P> = {
  [name in keyof P]?: QueryParameterValue | undefined
}

export class TreeWareUrlService<P extends TreeWareUrlQueryConfig> {
  constructor(private readonly router: Router, private readonly query: P) {}

  // Call this function in a global afterEach() router guard:
  // router.afterEach(() => { router.app.$treeWareUrlService.updateState() })
  updateState() {
    const urlQuery = this.router.currentRoute.query
    const urlQueryNames = Object.keys(urlQuery)

    const [inUrl, notInUrl] = partition(this.definedNames, item =>
      urlQueryNames.includes(item)
    )

    inUrl.forEach(name => {
      this.query[name].set(urlQuery[name])
    })
    if (urlQuery[OTHER] === TreeWareUrlOtherQueryParameters.reset)
      notInUrl.forEach(name => {
        this.query[name].reset()
      })
  }

  // NOTE: `location.query` will be replaced (not merged) with a computed query
  push(
    location: Location,
    querySpec: TreeWareUrlQuerySpec<P>,
    other: TreeWareUrlOtherQueryParameters,
    onComplete?: Function,
    onAbort?: ErrorHandler
  ) {
    location.query = this.getQuery(querySpec, other)
    this.router.push(location, onComplete, onAbort)
  }

  // NOTE: `location.query` will be replaced (not merged) with a computed query
  replace(
    location: Location,
    querySpec: TreeWareUrlQuerySpec<P>,
    other: TreeWareUrlOtherQueryParameters,
    onComplete?: Function,
    onAbort?: ErrorHandler
  ) {
    location.query = this.getQuery(querySpec, other)
    this.router.replace(location, onComplete, onAbort)
  }

  private getQuery(
    querySpec: TreeWareUrlQuerySpec<P>,
    other: TreeWareUrlOtherQueryParameters
  ): Dictionary<QueryParameterValue> {
    // If `other` is `asIs`, include existing query-parameters, except OTHER.
    // Existing query-parameters will be overridden by `querySpec`.
    const query: Dictionary<QueryParameterValue> =
      other === TreeWareUrlOtherQueryParameters.asIs
        ? this.getExistingQueryParameters()
        : {}
    // If a value is not specified in `querySpec` for a query-parameter,
    // use that parameter's get() function to get its value.
    Object.entries(querySpec).map(([name, spec]) => {
      query[name] = spec !== undefined ? spec : this.query[name].get()
    })
    if (other === TreeWareUrlOtherQueryParameters.reset) query[OTHER] = other
    return query
  }

  /** Returns a copy of existing query parameters without OTHER */
  private getExistingQueryParameters(): Dictionary<QueryParameterValue> {
    return Object.fromEntries(
      Object.entries(this.router.currentRoute.query).filter(
        ([name, _]) => name !== OTHER
      )
    )
  }

  private definedNames = Object.keys(this.query)
}

// WARNING: do NOT use this type as the type of the actual object used as the
// template parameter `P` in the following classes. Do NOT export this type.
// REASON: the methods in TreeWareUrlService class use `keyof P` as the type
// for method parameters to ensure that only parameters defined in `P` can be
// passed as parameters to the method. If the actual `P` is defined to be of
// type `TreeWareUrlQueryConfig` (the type defined below), any string can be
// passed to those methods, and we lose type-safety.
type TreeWareUrlQueryConfig = Dictionary<TreeWareUrlQueryParameterConfig>

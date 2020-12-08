import { SimLink, SimNode } from './TreeWareNetworkGraphInterfaces'
import { LinkDirection } from './TreeWareNetworkGraphTypes'

export function getPinnedLinks<N, L>(
  inputSimLinks: SimLink<N, L>[],
  pinnedIngress?: SimNode<N>,
  pinnedInternal?: SimNode<N>,
  pinnedEgress?: SimNode<N>
): SimLink<N, L>[] {
  // There are 8 combinations of the existence/non-existence of pinned nodes.
  // Each combination requires different handling. There are 8 functions
  // with each having a binary suffix that identifies the combination. The
  // parameter types also indicate the combination.
  if (!pinnedIngress) {
    if (!pinnedInternal) {
      if (!pinnedEgress) {
        return getPinnedLinks000(
          inputSimLinks,
          pinnedIngress,
          pinnedInternal,
          pinnedEgress
        )
      } else {
        return getPinnedLinks001(
          inputSimLinks,
          pinnedIngress,
          pinnedInternal,
          pinnedEgress
        )
      }
    } else {
      if (!pinnedEgress) {
        return getPinnedLinks010(
          inputSimLinks,
          pinnedIngress,
          pinnedInternal,
          pinnedEgress
        )
      } else {
        return getPinnedLinks011(
          inputSimLinks,
          pinnedIngress,
          pinnedInternal,
          pinnedEgress
        )
      }
    }
  } else {
    if (!pinnedInternal) {
      if (!pinnedEgress) {
        return getPinnedLinks100(
          inputSimLinks,
          pinnedIngress,
          pinnedInternal,
          pinnedEgress
        )
      } else {
        return getPinnedLinks101(
          inputSimLinks,
          pinnedIngress,
          pinnedInternal,
          pinnedEgress
        )
      }
    } else {
      if (!pinnedEgress) {
        return getPinnedLinks110(
          inputSimLinks,
          pinnedIngress,
          pinnedInternal,
          pinnedEgress
        )
      } else {
        return getPinnedLinks111(
          inputSimLinks,
          pinnedIngress,
          pinnedInternal,
          pinnedEgress
        )
      }
    }
  }
}

function getPinnedLinks000<N, L>(
  inputSimLinks: SimLink<N, L>[],
  pinnedIngress: undefined,
  pinnedInternal: undefined,
  pinnedEgress: undefined
): SimLink<N, L>[] {
  // There are no pinned nodes. Return all links.
  return [...inputSimLinks]
}

function getPinnedLinks001<N, L>(
  inputSimLinks: SimLink<N, L>[],
  pinnedIngress: undefined,
  pinnedInternal: undefined,
  pinnedEgress: SimNode<N>
): SimLink<N, L>[] {
  // Include all egress links connected to the pinned egress node.
  return inputSimLinks.filter(
    link =>
      link.direction === LinkDirection.EGRESS && link.target === pinnedEgress
  )
}

function getPinnedLinks010<N, L>(
  inputSimLinks: SimLink<N, L>[],
  pinnedIngress: undefined,
  pinnedInternal: SimNode<N>,
  pinnedEgress: undefined
): SimLink<N, L>[] {
  // Include all ingress and egress links connected to the pinned internal node.
  return inputSimLinks.filter(link =>
    link.direction === LinkDirection.INGRESS
      ? link.target === pinnedInternal
      : link.direction === LinkDirection.INTERNAL
      ? link.source === pinnedInternal || link.target === pinnedInternal
      : link.direction === LinkDirection.EGRESS
      ? link.source === pinnedInternal
      : false
  )
}

function getPinnedLinks011<N, L>(
  inputSimLinks: SimLink<N, L>[],
  pinnedIngress: undefined,
  pinnedInternal: SimNode<N>,
  pinnedEgress: SimNode<N>
): SimLink<N, L>[] {
  // Include all egress links connected to pinned internal and egress nodes.
  const pinnedLinks = inputSimLinks.filter(
    link =>
      link.direction === LinkDirection.EGRESS &&
      link.source === pinnedInternal &&
      link.target === pinnedEgress
  )
  // Include all ingress & internal links connected to internal nodes of above
  // egress links.
  const internalNodes = pinnedLinks.map(link => link.source)
  inputSimLinks
    .filter(link =>
      link.direction === LinkDirection.INGRESS
        ? internalNodes.includes(link.target)
        : link.direction === LinkDirection.INTERNAL
        ? internalNodes.includes(link.source) ||
          internalNodes.includes(link.target)
        : false
    )
    .forEach(link => {
      pinnedLinks.push(link)
    })
  return pinnedLinks
}

function getPinnedLinks100<N, L>(
  inputSimLinks: SimLink<N, L>[],
  pinnedIngress: SimNode<N>,
  pinnedInternal: undefined,
  pinnedEgress: undefined
): SimLink<N, L>[] {
  // Include all ingress links connected to the pinned ingress node.
  return inputSimLinks.filter(
    link =>
      link.direction === LinkDirection.INGRESS && link.source === pinnedIngress
  )
}

function getPinnedLinks101<N, L>(
  inputSimLinks: SimLink<N, L>[],
  pinnedIngress: SimNode<N>,
  pinnedInternal: undefined,
  pinnedEgress: SimNode<N>
): SimLink<N, L>[] {
  // Include ingress & egress links connected to pinned ingress & egress nodes.
  return inputSimLinks.filter(link =>
    link.direction === LinkDirection.INGRESS
      ? link.source === pinnedIngress
      : link.direction === LinkDirection.EGRESS
      ? link.target === pinnedEgress
      : false
  )
}

function getPinnedLinks110<N, L>(
  inputSimLinks: SimLink<N, L>[],
  pinnedIngress: SimNode<N>,
  pinnedInternal: SimNode<N>,
  pinnedEgress: undefined
): SimLink<N, L>[] {
  // Include all ingress links connected to pinned ingress and internal nodes.
  const pinnedLinks = inputSimLinks.filter(
    link =>
      link.direction === LinkDirection.INGRESS &&
      link.source === pinnedIngress &&
      link.target === pinnedInternal
  )
  // Include all internal & egress links connected to internal nodes of above
  // ingress links.
  const internalNodes = pinnedLinks.map(link => link.target)
  inputSimLinks
    .filter(link =>
      link.direction === LinkDirection.INTERNAL
        ? internalNodes.includes(link.source) ||
          internalNodes.includes(link.target)
        : link.direction === LinkDirection.EGRESS
        ? internalNodes.includes(link.source)
        : false
    )
    .forEach(link => {
      pinnedLinks.push(link)
    })
  return pinnedLinks
}

function getPinnedLinks111<N, L>(
  inputSimLinks: SimLink<N, L>[],
  pinnedIngress: SimNode<N>,
  pinnedInternal: SimNode<N>,
  pinnedEgress: SimNode<N>
): SimLink<N, L>[] {
  // Include all ingress and egress links connected to pinned nodes on both
  // ends of the links. Include internal links that are connected to pinned
  // internal node on one end.
  return inputSimLinks.filter(link =>
    link.direction === LinkDirection.INGRESS
      ? link.source === pinnedIngress && link.target === pinnedInternal
      : link.direction === LinkDirection.INTERNAL
      ? link.source === pinnedInternal || link.target === pinnedInternal
      : link.direction === LinkDirection.EGRESS
      ? link.source === pinnedInternal && link.target === pinnedEgress
      : false
  )
}

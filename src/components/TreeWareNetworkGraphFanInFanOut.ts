import { SimLink, SimNode } from './TreeWareNetworkGraphInterfaces'
import { LinkDirection } from './TreeWareNetworkGraphTypes'

export function getFanInFanOutLinks<N, L>(
  inputSimLinks: SimLink<N, L>[],
  ingress?: SimNode<N>,
  internal?: SimNode<N>,
  egress?: SimNode<N>
): SimLink<N, L>[] {
  // There are 8 combinations of the existence/non-existence of pinned nodes.
  // Each combination requires different handling. There are 8 functions
  // with each having a binary suffix that identifies the combination. The
  // parameter types also indicate the combination.
  if (!ingress) {
    if (!internal) {
      if (!egress) {
        return getFanInFanOutLinks000(inputSimLinks, ingress, internal, egress)
      } else {
        return getFanInFanOutLinks001(inputSimLinks, ingress, internal, egress)
      }
    } else {
      if (!egress) {
        return getFanInFanOutLinks010(inputSimLinks, ingress, internal, egress)
      } else {
        return getFanInFanOutLinks011(inputSimLinks, ingress, internal, egress)
      }
    }
  } else {
    if (!internal) {
      if (!egress) {
        return getFanInFanOutLinks100(inputSimLinks, ingress, internal, egress)
      } else {
        return getFanInFanOutLinks101(inputSimLinks, ingress, internal, egress)
      }
    } else {
      if (!egress) {
        return getFanInFanOutLinks110(inputSimLinks, ingress, internal, egress)
      } else {
        return getFanInFanOutLinks111(inputSimLinks, ingress, internal, egress)
      }
    }
  }
}

function getFanInFanOutLinks000<N, L>(
  inputSimLinks: SimLink<N, L>[],
  ingress: undefined,
  internal: undefined,
  egress: undefined
): SimLink<N, L>[] {
  // There are no pinned nodes. Return all links.
  return [...inputSimLinks]
}

function getFanInFanOutLinks001<N, L>(
  inputSimLinks: SimLink<N, L>[],
  ingress: undefined,
  internal: undefined,
  egress: SimNode<N>
): SimLink<N, L>[] {
  // Include all egress links connected to the pinned egress node.
  const pinnedLinks = inputSimLinks.filter(
    link => link.direction === LinkDirection.EGRESS && link.target === egress
  )
  // Include all ingress & internal links connected to internal nodes which
  // are connected to the above egress links.
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

function getFanInFanOutLinks010<N, L>(
  inputSimLinks: SimLink<N, L>[],
  ingress: undefined,
  internal: SimNode<N>,
  egress: undefined
): SimLink<N, L>[] {
  // Include all ingress and egress links connected to the pinned internal node.
  return inputSimLinks.filter(link =>
    link.direction === LinkDirection.INGRESS
      ? link.target === internal
      : link.direction === LinkDirection.INTERNAL
      ? link.source === internal || link.target === internal
      : link.direction === LinkDirection.EGRESS
      ? link.source === internal
      : false
  )
}

function getFanInFanOutLinks011<N, L>(
  inputSimLinks: SimLink<N, L>[],
  ingress: undefined,
  internal: SimNode<N>,
  egress: SimNode<N>
): SimLink<N, L>[] {
  // Include all egress links connected to pinned internal and egress nodes.
  const pinnedLinks = inputSimLinks.filter(
    link =>
      link.direction === LinkDirection.EGRESS &&
      link.source === internal &&
      link.target === egress
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

function getFanInFanOutLinks100<N, L>(
  inputSimLinks: SimLink<N, L>[],
  ingress: SimNode<N>,
  internal: undefined,
  egress: undefined
): SimLink<N, L>[] {
  // Include all ingress links connected to the pinned ingress node.
  const pinnedLinks = inputSimLinks.filter(
    link => link.direction === LinkDirection.INGRESS && link.source === ingress
  )
  // Include all internal & egress links connected to internal nodes which
  // are connected to the above ingress links.
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

function getFanInFanOutLinks101<N, L>(
  inputSimLinks: SimLink<N, L>[],
  ingress: SimNode<N>,
  internal: undefined,
  egress: SimNode<N>
): SimLink<N, L>[] {
  // Include ingress & egress links connected to pinned ingress & egress nodes.
  const pinnedLinks = inputSimLinks.filter(link =>
    link.direction === LinkDirection.INGRESS
      ? link.source === ingress
      : link.direction === LinkDirection.EGRESS
      ? link.target === egress
      : false
  )
  // Include all internal links connected to internal nodes of above links.
  const internalNodes = pinnedLinks.map(link =>
    link.direction === LinkDirection.INGRESS ? link.target : link.source
  )
  inputSimLinks
    .filter(link =>
      link.direction === LinkDirection.INTERNAL
        ? internalNodes.includes(link.source) ||
          internalNodes.includes(link.target)
        : false
    )
    .forEach(link => {
      pinnedLinks.push(link)
    })
  return pinnedLinks
}

function getFanInFanOutLinks110<N, L>(
  inputSimLinks: SimLink<N, L>[],
  ingress: SimNode<N>,
  internal: SimNode<N>,
  egress: undefined
): SimLink<N, L>[] {
  // Include all ingress links connected to pinned ingress and internal nodes.
  const pinnedLinks = inputSimLinks.filter(
    link =>
      link.direction === LinkDirection.INGRESS &&
      link.source === ingress &&
      link.target === internal
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

function getFanInFanOutLinks111<N, L>(
  inputSimLinks: SimLink<N, L>[],
  ingress: SimNode<N>,
  internal: SimNode<N>,
  egress: SimNode<N>
): SimLink<N, L>[] {
  // Include all ingress and egress links connected to pinned nodes on both
  // ends of the links. Include internal links that are connected to pinned
  // internal node on one end.
  return inputSimLinks.filter(link =>
    link.direction === LinkDirection.INGRESS
      ? link.source === ingress && link.target === internal
      : link.direction === LinkDirection.INTERNAL
      ? link.source === internal || link.target === internal
      : link.direction === LinkDirection.EGRESS
      ? link.source === internal && link.target === egress
      : false
  )
}

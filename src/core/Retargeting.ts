import { AnimationClip, KeyframeTrack } from 'three'

function normalizeName(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9_]/g, '')
}

const HINTS: Array<{ key: string; aliases: string[] }> = [
  { key: 'hips', aliases: ['hips', 'pelvis'] },
  { key: 'spine', aliases: ['spine', 'spine1', 'spine2', 'chest'] },
  { key: 'neck', aliases: ['neck'] },
  { key: 'head', aliases: ['head'] },
  { key: 'clavicle_l', aliases: ['leftshoulder', 'lshoulder', 'clavicle_l'] },
  { key: 'clavicle_r', aliases: ['rightshoulder', 'rshoulder', 'clavicle_r'] },
  { key: 'upperarm_l', aliases: ['leftarm', 'upperarm_l'] },
  { key: 'upperarm_r', aliases: ['rightarm', 'upperarm_r'] },
  { key: 'lowerarm_l', aliases: ['leftforearm', 'lowerarm_l', 'forearm_l'] },
  { key: 'lowerarm_r', aliases: ['rightforearm', 'lowerarm_r', 'forearm_r'] },
  { key: 'hand_l', aliases: ['lefthand', 'hand_l'] },
  { key: 'hand_r', aliases: ['righthand', 'hand_r'] },
  { key: 'upperleg_l', aliases: ['leftupleg', 'leftthigh', 'upperleg_l', 'thigh_l'] },
  { key: 'upperleg_r', aliases: ['rightupleg', 'rightthigh', 'upperleg_r', 'thigh_r'] },
  { key: 'lowerleg_l', aliases: ['leftleg', 'calf_l', 'lowerleg_l'] },
  { key: 'lowerleg_r', aliases: ['rightleg', 'calf_r', 'lowerleg_r'] },
  { key: 'foot_l', aliases: ['leftfoot', 'foot_l'] },
  { key: 'foot_r', aliases: ['rightfoot', 'foot_r'] },
  { key: 'toe_l', aliases: ['lefttoe', 'toebase_l', 'toe_l'] },
  { key: 'toe_r', aliases: ['righttoe', 'toebase_r', 'toe_r'] }
]

export function buildNameMapping(sourceBoneNames: string[], targetBoneNames: string[]): Record<string, string> {
  const mapping: Record<string, string> = {}
  const targetNorm = targetBoneNames.map(n => ({ raw: n, norm: normalizeName(n) }))

  function findTargetFor(normName: string): string | null {
    // Direct match
    const direct = targetNorm.find(t => t.norm === normName)
    if (direct) return direct.raw
    // Heuristic by hints
    for (const hint of HINTS) {
      if (hint.aliases.some(a => normName.includes(a))) {
        const cand = targetNorm.find(t => hint.aliases.some(a => t.norm.includes(a)))
        if (cand) return cand.raw
      }
    }
    // Side markers
    if (normName.includes('left') || normName.includes('_l')) {
      const cand = targetNorm.find(t => t.norm.includes('left') || t.norm.endsWith('_l'))
      if (cand) return cand.raw
    }
    if (normName.includes('right') || normName.includes('_r')) {
      const cand = targetNorm.find(t => t.norm.includes('right') || t.norm.endsWith('_r'))
      if (cand) return cand.raw
    }
    return null
  }

  for (const s of sourceBoneNames) {
    const norm = normalizeName(s)
    const tgt = findTargetFor(norm)
    if (tgt) mapping[s] = tgt
  }
  return mapping
}

export function retargetClipsByName(
  sourceClips: AnimationClip[],
  nameMapping: Record<string, string>
): AnimationClip[] {
  const remapped: AnimationClip[] = []
  for (const clip of sourceClips) {
    const newTracks: KeyframeTrack[] = []
    for (const track of clip.tracks) {
      // Track name format: 'Node.property' or 'Node.property[component]'
      const parts = track.name.split('.')
      if (parts.length < 2) continue
      const sourceNode = parts[0]
      const mapped = nameMapping[sourceNode]
      if (!mapped) continue
      const newName = [mapped, ...parts.slice(1)].join('.')
      const ctor = (track as any).constructor
      const cloned = new ctor(newName, track.times.slice(), (track as any).values.slice())
      newTracks.push(cloned)
    }
    if (newTracks.length > 0) {
      remapped.push(new AnimationClip(clip.name, clip.duration, newTracks))
    }
  }
  return remapped
}



import { Plug } from 'lucide-react'
import { ApplianceVisualKey, applianceByName } from '../../../domain/sizing'
import applianceSprite from '../../../assets/appliance-sprite.png'
import buildingCommonCctv from '../../../assets/building-common-cctv.png'
import buildingCommonPump from '../../../assets/building-common-pump.png'
import buildingCommonElevator from '../../../assets/building-common-elevator.png'
import buildingCommonSafetyLight from '../../../assets/building-common-safety-light.png'
import buildingCommonGate from '../../../assets/building-common-gate.png'

type ApplianceVisualVariant = 'row' | 'compact' | 'preview' | 'card'

const spriteClass: Partial<Record<ApplianceVisualKey, string>> = {
  bulb: 'sprite-bulb',
  fridge: 'sprite-fridge',
  blender: 'sprite-blender',
  tv: 'sprite-tv',
  decoder: 'sprite-decoder',
  router: 'sprite-router',
  fan: 'sprite-fan',
  microwave: 'sprite-microwave',
  washer: 'sprite-washer',
  'rice-cooker': 'sprite-rice',
  laptop: 'sprite-laptop',
  iron: 'sprite-iron',
}

const imageByVisual: Partial<Record<ApplianceVisualKey, string>> = {
  cctv: buildingCommonCctv,
  pump: buildingCommonPump,
  elevator: buildingCommonElevator,
  gate: buildingCommonGate,
  'safety-light': buildingCommonSafetyLight,
}

/** Standard visual treatment for every catalogue appliance across sizing flows. */
export function ApplianceVisual({ name, variant = 'row', className = '' }: { name: string; variant?: ApplianceVisualVariant; className?: string }) {
  const visual = applianceByName(name)?.visual
  const sprite = visual && spriteClass[visual]
  if (sprite) return <div className={`applianceThumbnail ${variant} ${sprite} ${className}`} style={{ backgroundImage: `url(${applianceSprite})` }} role="img" aria-label={name} />

  const image = visual && imageByVisual[visual]
  if (image) return <div className={`applianceThumbnail applianceVisualImage ${variant} ${className}`} role="img" aria-label={name}><img src={image} alt="" /></div>

  const Icon = Plug
  return <div className={`deviceicon applianceVisualFallback ${variant === 'preview' ? 'big' : ''} ${className}`} role="img" aria-label={name}><Icon size={variant === 'preview' ? 45 : 27} /></div>
}

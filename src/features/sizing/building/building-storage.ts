import type { Appliance } from '../../../domain/sizing'
import { browserStorage } from '../../../shared/lib/browser-storage'

export type BuildingProfileId = 'essential' | 'standard' | 'comfort'
export type BuildingProfileDistribution = Record<BuildingProfileId, number>

export type BuildingSizingConfiguration = {
  floors: number
  homes: number
  sameProfile: boolean
  singleProfile: BuildingProfileId
  distribution: BuildingProfileDistribution
  commonAppliances: Appliance[]
}

export const buildingCommonAppliancesStorageKey = 'djua-building-common-appliances-v2'
export const buildingSizingConfigurationStorageKey = 'djua-building-sizing-config'

export const buildingProfileAppliancesStorageKey = (profile: BuildingProfileId) => `djua-building-profile-${profile}-items`

export const readBuildingSizingConfiguration = () => browserStorage.get<BuildingSizingConfiguration | null>(buildingSizingConfigurationStorageKey, null)
export const saveBuildingSizingConfiguration = (configuration: BuildingSizingConfiguration) => browserStorage.set(buildingSizingConfigurationStorageKey, configuration)
export const readBuildingProfileAppliances = (profile: BuildingProfileId) => browserStorage.get<Appliance[]>(buildingProfileAppliancesStorageKey(profile), [])

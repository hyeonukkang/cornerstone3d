import { CornerstoneTools3DEvents as EVENTS } from '../enums'
import { renderLabelmaps } from './labelmapEventHandlers'
import state from '../store/SegmentationModule/state'

const onLabelmapUpdated = function (evt) {
  const { sceneUID, viewportUID, renderingEngineUID } = evt.detail

  if (!sceneUID) {
    throw new Error('Segmentation for stack viewports not implemented yet')
  }

  // Todo: can different viewport of scenes have different activeLabelmapIndex? I think not
  const { activeLabelmapIndex } = state.volumeViewports[viewportUID]

  // renderActiveLabelmaps(scene, viewportUID, activeLabelmapIndex)
  renderLabelmaps(
    viewportUID,
    sceneUID,
    renderingEngineUID,
    activeLabelmapIndex
  )
}

const enable = function (element) {
  element.addEventListener(EVENTS.LABELMAP_UPDATED, onLabelmapUpdated)
}

const disable = function (element) {
  element.removeEventListener(EVENTS.LABELMAP_UPDATED, onLabelmapUpdated)
}

export default {
  enable,
  disable,
}

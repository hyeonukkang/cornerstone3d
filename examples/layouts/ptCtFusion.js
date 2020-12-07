import vtkConstants from 'vtk.js/Sources/Rendering/Core/VolumeMapper/Constants';
import { CONSTANTS } from './../../src/index';
import { SCENE_IDS, VIEWPORT_IDS } from '../constants';
import {
  setCTWWWC,
  setPetTransferFunction,
  getSetPetColorMapTransferFunction,
} from '../helpers/transferFunctionHelpers';

const { ORIENTATION, VIEWPORT_TYPE } = CONSTANTS;
const { BlendMode } = vtkConstants;

function setLayout(
  renderingEngine,
  canvasContainers,
  {
    ctSceneToolGroup,
    ptSceneToolGroup,
    fusionSceneToolGroup,
    ptMipSceneToolGroup,
  }
) {
  const viewportInput = [
    // CT
    {
      sceneUID: SCENE_IDS.CT,
      viewportUID: VIEWPORT_IDS.CT.AXIAL,
      type: VIEWPORT_TYPE.ORTHOGRAPHIC,
      canvas: canvasContainers.CT.AXIAL.current,
      defaultOptions: {
        orientation: ORIENTATION.AXIAL,
      },
    },
    {
      sceneUID: SCENE_IDS.CT,
      viewportUID: VIEWPORT_IDS.CT.SAGITTAL,
      type: VIEWPORT_TYPE.ORTHOGRAPHIC,
      canvas: canvasContainers.CT.SAGITTAL.current,
      defaultOptions: {
        orientation: ORIENTATION.SAGITTAL,
      },
    },
    {
      sceneUID: SCENE_IDS.CT,
      viewportUID: VIEWPORT_IDS.CT.CORONAL,
      type: VIEWPORT_TYPE.ORTHOGRAPHIC,
      canvas: canvasContainers.CT.CORONAL.current,
      defaultOptions: {
        orientation: ORIENTATION.CORONAL,
      },
    },

    // PT

    {
      sceneUID: SCENE_IDS.PT,
      viewportUID: VIEWPORT_IDS.PT.AXIAL,
      type: VIEWPORT_TYPE.ORTHOGRAPHIC,
      canvas: canvasContainers.PT.AXIAL.current,
      defaultOptions: {
        orientation: ORIENTATION.AXIAL,
        background: [1, 1, 1],
      },
    },
    {
      sceneUID: SCENE_IDS.PT,
      viewportUID: VIEWPORT_IDS.PT.SAGITTAL,
      type: VIEWPORT_TYPE.ORTHOGRAPHIC,
      canvas: canvasContainers.PT.SAGITTAL.current,
      defaultOptions: {
        orientation: ORIENTATION.SAGITTAL,
        background: [1, 1, 1],
      },
    },
    {
      sceneUID: SCENE_IDS.PT,
      viewportUID: VIEWPORT_IDS.PT.CORONAL,
      type: VIEWPORT_TYPE.ORTHOGRAPHIC,
      canvas: canvasContainers.PT.CORONAL.current,
      defaultOptions: {
        orientation: ORIENTATION.CORONAL,
        background: [1, 1, 1],
      },
    },

    // Fusion

    {
      sceneUID: SCENE_IDS.FUSION,
      viewportUID: VIEWPORT_IDS.FUSION.AXIAL,
      type: VIEWPORT_TYPE.ORTHOGRAPHIC,
      canvas: canvasContainers.FUSION.AXIAL.current,
      defaultOptions: {
        orientation: ORIENTATION.AXIAL,
      },
    },
    {
      sceneUID: SCENE_IDS.FUSION,
      viewportUID: VIEWPORT_IDS.FUSION.SAGITTAL,
      type: VIEWPORT_TYPE.ORTHOGRAPHIC,
      canvas: canvasContainers.FUSION.SAGITTAL.current,
      defaultOptions: {
        orientation: ORIENTATION.SAGITTAL,
      },
    },
    {
      sceneUID: SCENE_IDS.FUSION,
      viewportUID: VIEWPORT_IDS.FUSION.CORONAL,
      type: VIEWPORT_TYPE.ORTHOGRAPHIC,
      canvas: canvasContainers.FUSION.CORONAL.current,
      defaultOptions: {
        orientation: ORIENTATION.CORONAL,
      },
    },

    // PET MIP
    {
      sceneUID: SCENE_IDS.PTMIP,
      viewportUID: VIEWPORT_IDS.PTMIP.CORONAL,
      type: VIEWPORT_TYPE.ORTHOGRAPHIC,
      canvas: canvasContainers.PTMIP.CORONAL.current,
      defaultOptions: {
        orientation: ORIENTATION.CORONAL,
        background: [1, 1, 1],
      },
    },
  ];

  renderingEngine.setViewports(viewportInput);

  // Add tools

  const renderingEngineUID = renderingEngine.uid;

  viewportInput.forEach(viewportInputEntry => {
    const { sceneUID, viewportUID } = viewportInputEntry;

    if (sceneUID === SCENE_IDS.CT) {
      ctSceneToolGroup.addViewports(renderingEngineUID, sceneUID, viewportUID);
    } else if (sceneUID === SCENE_IDS.PT) {
      ptSceneToolGroup.addViewports(renderingEngineUID, sceneUID, viewportUID);
    } else if (sceneUID === SCENE_IDS.FUSION) {
      fusionSceneToolGroup.addViewports(
        renderingEngineUID,
        sceneUID,
        viewportUID
      );
    } else if (sceneUID === SCENE_IDS.PTMIP) {
      ptMipSceneToolGroup.addViewports(
        renderingEngineUID,
        sceneUID,
        viewportUID
      );
    }
  });

  // Render backgrounds
  renderingEngine.render();
}

function setVolumes(renderingEngine, ctVolumeUID, ptVolumeUID, petColorMap) {
  const ctScene = renderingEngine.getScene(SCENE_IDS.CT);
  const ptScene = renderingEngine.getScene(SCENE_IDS.PT);
  const fusionScene = renderingEngine.getScene(SCENE_IDS.FUSION);
  const ptMipScene = renderingEngine.getScene(SCENE_IDS.PTMIP);

  ctScene.setVolumes([{ volumeUID: ctVolumeUID, callback: setCTWWWC }]);
  ptScene.setVolumes([
    { volumeUID: ptVolumeUID, callback: setPetTransferFunction },
  ]);

  fusionScene.setVolumes([
    { volumeUID: ctVolumeUID, callback: setCTWWWC },
    {
      volumeUID: ptVolumeUID,
      callback: getSetPetColorMapTransferFunction(petColorMap),
    },
  ]);

  const ptVolume = imageCache.getImageVolume(ptVolumeUID);
  const ptVolumeDimensions = ptVolume.dimensions;

  // Only make the MIP as large as it needs to be. This coronal MIP will be
  // rotated so need the diagonal across the Axial Plane.

  const slabThickness = Math.sqrt(
    ptVolumeDimensions[0] * ptVolumeDimensions[0] +
      ptVolumeDimensions[1] * ptVolumeDimensions[1]
  );

  ptMipScene.setVolumes([
    {
      volumeUID: ptVolumeUID,
      callback: setPetTransferFunction,
      blendMode: BlendMode.MAXIMUM_INTENSITY_BLEND,
      slabThickness,
    },
  ]);
}

export default { setLayout, setVolumes };
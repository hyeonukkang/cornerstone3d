import {
  RenderingEngine,
  Types,
  Enums,
  setVolumesForViewports,
  volumeLoader,
  getRenderingEngine,
} from '@cornerstonejs/core';
import {
  initDemo,
  createImageIdsAndCacheMetaData,
  setCtTransferFunctionForVolumeActor,
  addDropdownToToolbar,
} from '../../../../utils/demo/helpers';
import * as cornerstoneTools from '@cornerstonejs/tools';

const {
  ToolGroupManager,
  Enums: csToolsEnums,
  WindowLevelTool,
  PanTool,
  ZoomTool,
  StackScrollMouseWheelTool,
  synchronizers,
  MIPJumpToClickTool,
  VolumeRotateMouseWheelTool,
  CrosshairsTool,
} = cornerstoneTools;

const { MouseBindings } = csToolsEnums;
const { ViewportType } = Enums;

const { createCameraPositionSynchronizer, createVOISynchronizer } =
  synchronizers;

let renderingEngine;
const renderingEngineId = 'myRenderingEngine';
const volumeLoaderScheme = 'cornerstoneStreamingImageVolume'; // Loader id which defines which volume loader to use
const ctVolumeName = 'CT_VOLUME_ID'; // Id of the volume less loader prefix
const ctVolumeId = `${volumeLoaderScheme}:${ctVolumeName}`; // VolumeId with loader id + volume id
const ctToolGroupId = 'CT_TOOLGROUP_ID';
const mipToolGroupUID = 'MIP_TOOLGROUP_ID';

const viewportIds = {
  CT: { AXIAL: 'CT_AXIAL', SAGITTAL: 'CT_SAGITTAL', CORONAL: 'CT_CORONAL' },
};

// ======== Set up page ======== //
const optionsValues = [WindowLevelTool.toolName, CrosshairsTool.toolName];

// ============================= //
// WindowLevel: 화면 중앙에 Crosshair 고정
// Crosshair: 커서가 Crosshair가 됨
addDropdownToToolbar({
  options: { values: optionsValues, defaultValue: WindowLevelTool.toolName },
  onSelectedValueChange: (toolNameAsStringOrNumber) => {
    const toolName = String(toolNameAsStringOrNumber);

    [ctToolGroupId].forEach((toolGroupId) => {
      const toolGroup = ToolGroupManager.getToolGroup(toolGroupId);

      if (toolName === WindowLevelTool.toolName) {
        toolGroup.setToolPassive(CrosshairsTool.toolName);
        toolGroup.setToolActive(WindowLevelTool.toolName, {
          bindings: [{ mouseButton: MouseBindings.Primary }],
        });
      } else {
        toolGroup.setToolDisabled(WindowLevelTool.toolName);
        toolGroup.setToolActive(CrosshairsTool.toolName, {
          bindings: [{ mouseButton: MouseBindings.Primary }],
        });
      }
    });
  },
});

const resizeObserver = new ResizeObserver(() => {
  renderingEngine = getRenderingEngine(renderingEngineId);

  if (renderingEngine) {
    renderingEngine.resize(true, false);
  }
});

const viewportGrid = document.createElement('div');

viewportGrid.style.display = 'grid';
viewportGrid.style.width = '95vw';
viewportGrid.style.height = '60vh';

const content = document.getElementById('content');

content.appendChild(viewportGrid);

const element1_1 = document.createElement('div');
const element1_2 = document.createElement('div');
const element1_3 = document.createElement('div');

// Place main 3x3 viewports
element1_1.style.gridColumnStart = '1';
element1_1.style.gridRowStart = '1';
element1_2.style.gridColumnStart = '2';
element1_2.style.gridRowStart = '1';
element1_3.style.gridColumnStart = '3';
element1_3.style.gridRowStart = '1';

viewportGrid.appendChild(element1_1);
viewportGrid.appendChild(element1_2);
viewportGrid.appendChild(element1_3);

const elements = [element1_1, element1_2, element1_3];

elements.forEach((element) => {
  element.style.width = '100%';
  element.style.height = '100%';

  // Disable right click context menu so we can have right click tools
  element.oncontextmenu = (e) => e.preventDefault();

  resizeObserver.observe(element);
});

// ============================= //

const viewportColors = {
  [viewportIds.CT.AXIAL]: 'rgb(200, 0, 0)',
  [viewportIds.CT.SAGITTAL]: 'rgb(200, 200, 0)',
  [viewportIds.CT.CORONAL]: 'rgb(0, 200, 0)',
};

const viewportReferenceLineControllable = [
  viewportIds.CT.AXIAL,
  viewportIds.CT.SAGITTAL,
  viewportIds.CT.CORONAL,
];

const viewportReferenceLineDraggableRotatable = [
  viewportIds.CT.AXIAL,
  viewportIds.CT.SAGITTAL,
  viewportIds.CT.CORONAL,
];

const viewportReferenceLineSlabThicknessControlsOn = [
  viewportIds.CT.AXIAL,
  viewportIds.CT.SAGITTAL,
  viewportIds.CT.CORONAL,
];

function getReferenceLineColor(viewportId) {
  return viewportColors[viewportId];
}

function getReferenceLineControllable(viewportId) {
  const index = viewportReferenceLineControllable.indexOf(viewportId);
  return index !== -1;
}

function getReferenceLineDraggableRotatable(viewportId) {
  const index = viewportReferenceLineDraggableRotatable.indexOf(viewportId);
  return index !== -1;
}

function getReferenceLineSlabThicknessControlsOn(viewportId) {
  const index =
    viewportReferenceLineSlabThicknessControlsOn.indexOf(viewportId);
  return index !== -1;
}

function setUpToolGroups() {
  // Add tools to Cornerstone3D
  // cornerstoneTools.addTool(WindowLevelTool);
  // cornerstoneTools.addTool(PanTool);
  // cornerstoneTools.addTool(ZoomTool);
  // cornerstoneTools.addTool(StackScrollMouseWheelTool);
  cornerstoneTools.addTool(MIPJumpToClickTool);
  // cornerstoneTools.addTool(VolumeRotateMouseWheelTool);
  cornerstoneTools.addTool(CrosshairsTool);

  const ctToolGroup = ToolGroupManager.createToolGroup(ctToolGroupId);

  ctToolGroup.addViewport(viewportIds.CT.AXIAL, renderingEngineId);
  ctToolGroup.addViewport(viewportIds.CT.SAGITTAL, renderingEngineId);
  ctToolGroup.addViewport(viewportIds.CT.CORONAL, renderingEngineId);
  ctToolGroup.addTool(CrosshairsTool.toolName, {
    getReferenceLineColor,
    getReferenceLineControllable,
    getReferenceLineDraggableRotatable,
    getReferenceLineSlabThicknessControlsOn,
  });

  // Here is the difference in the toolGroups used, that we need to specify the
  // volume to use for the WindowLevelTool for the fusion viewports
  ctToolGroup.addTool(WindowLevelTool.toolName);

  [ctToolGroup].forEach((toolGroup) => {
    toolGroup.setToolActive(WindowLevelTool.toolName, {
      bindings: [
        {
          mouseButton: MouseBindings.Primary, // Left Click
        },
      ],
    });
    toolGroup.setToolActive(PanTool.toolName, {
      bindings: [
        {
          mouseButton: MouseBindings.Auxiliary, // Middle Click
        },
      ],
    });
    toolGroup.setToolActive(ZoomTool.toolName, {
      bindings: [
        {
          mouseButton: MouseBindings.Secondary, // Right Click
        },
      ],
    });

    toolGroup.setToolActive(StackScrollMouseWheelTool.toolName);
    toolGroup.setToolPassive(CrosshairsTool.toolName);
  });

  // MIP Tool Groups
  const mipToolGroup = ToolGroupManager.createToolGroup(mipToolGroupUID);

  mipToolGroup.addTool('VolumeRotateMouseWheel');
  mipToolGroup.addTool('MIPJumpToClickTool', {
    targetViewportIds: [
      viewportIds.CT.AXIAL,
      viewportIds.CT.SAGITTAL,
      viewportIds.CT.CORONAL,
    ],
  });

  // Set the initial state of the tools, here we set one tool active on left click.
  // This means left click will draw that tool.
  mipToolGroup.setToolActive('MIPJumpToClickTool', {
    bindings: [
      {
        mouseButton: MouseBindings.Primary, // Left Click
      },
    ],
  });
  // As the Stack Scroll mouse wheel is a tool using the `mouseWheelCallback`
  // hook instead of mouse buttons, it does not need to assign any mouse button.
  mipToolGroup.setToolActive('VolumeRotateMouseWheel');
}

function setUpSynchronizers() {
  const axialCameraSynchronizerId = 'AXIAL_CAMERA_SYNCHRONIZER_ID';
  const sagittalCameraSynchronizerId = 'SAGITTAL_CAMERA_SYNCHRONIZER_ID';
  const coronalCameraSynchronizerId = 'CORONAL_CAMERA_SYNCHRONIZER_ID';
  const ctVoiSynchronizerId = 'CT_VOI_SYNCHRONIZER_ID';

  const axialCameraPositionSynchronizer = createCameraPositionSynchronizer(
    axialCameraSynchronizerId
  );
  const sagittalCameraPositionSynchronizer = createCameraPositionSynchronizer(
    sagittalCameraSynchronizerId
  );
  const coronalCameraPositionSynchronizer = createCameraPositionSynchronizer(
    coronalCameraSynchronizerId
  );
  const ctVoiSynchronizer = createVOISynchronizer(ctVoiSynchronizerId);

  // Add viewports to camera synchronizers
  [viewportIds.CT.AXIAL].forEach((viewportId) => {
    axialCameraPositionSynchronizer.add({
      renderingEngineId,
      viewportId,
    });
  });
  [viewportIds.CT.SAGITTAL].forEach((viewportId) => {
    sagittalCameraPositionSynchronizer.add({
      renderingEngineId,
      viewportId,
    });
  });
  [viewportIds.CT.CORONAL].forEach((viewportId) => {
    coronalCameraPositionSynchronizer.add({
      renderingEngineId,
      viewportId,
    });
  });

  // Add viewports to VOI synchronizers
  [
    viewportIds.CT.AXIAL,
    viewportIds.CT.SAGITTAL,
    viewportIds.CT.CORONAL,
  ].forEach((viewportId) => {
    ctVoiSynchronizer.add({
      renderingEngineId,
      viewportId,
    });
  });
  [].forEach((viewportId) => {
    // In this example, the fusion viewports are only targets for CT VOI
    // synchronization, not sources
    ctVoiSynchronizer.addTarget({
      renderingEngineId,
      viewportId,
    });
  });
}

async function setUpDisplay() {
  const wadoRsRoot = 'https://d3t6nz73ql33tx.cloudfront.net/dicomweb';
  const StudyInstanceUID =
    '1.3.6.1.4.1.14519.5.2.1.7009.2403.334240657131972136850343327463';

  // Get Cornerstone imageIds and fetch metadata into RAM
  const ctImageIds = await createImageIdsAndCacheMetaData({
    StudyInstanceUID,
    SeriesInstanceUID:
      '1.3.6.1.4.1.14519.5.2.1.7009.2403.226151125820845824875394858561',
    wadoRsRoot,
    type: 'VOLUME',
  });

  // Define a volume in memory
  const ctVolume = await volumeLoader.createAndCacheVolume(ctVolumeId, {
    imageIds: ctImageIds,
  });

  // Create the viewports

  const viewportInputArray = [
    {
      viewportId: viewportIds.CT.AXIAL,
      type: ViewportType.ORTHOGRAPHIC,
      element: element1_1,
      defaultOptions: {
        orientation: Enums.OrientationAxis.AXIAL,
      },
    },
    {
      viewportId: viewportIds.CT.SAGITTAL,
      type: ViewportType.ORTHOGRAPHIC,
      element: element1_2,
      defaultOptions: {
        orientation: Enums.OrientationAxis.SAGITTAL,
      },
    },
    {
      viewportId: viewportIds.CT.CORONAL,
      type: ViewportType.ORTHOGRAPHIC,
      element: element1_3,
      defaultOptions: {
        orientation: Enums.OrientationAxis.CORONAL,
      },
    },
  ];

  renderingEngine.setViewports(viewportInputArray);

  // Set the volumes to load
  ctVolume.load();

  // Set volumes on the viewports
  await setVolumesForViewports(
    renderingEngine,
    [
      {
        volumeId: ctVolumeId,
        callback: setCtTransferFunctionForVolumeActor,
      },
    ],
    [viewportIds.CT.AXIAL, viewportIds.CT.SAGITTAL, viewportIds.CT.CORONAL]
  );

  initializeCameraSync(renderingEngine);

  // Render the viewports
  renderingEngine.render();
}

function initializeCameraSync(renderingEngine) {
  renderingEngine.render();
}

/**
 * Runs the demo
 */
async function run() {
  // Init Cornerstone and related libraries
  await initDemo();

  // Instantiate a rendering engine
  renderingEngine = new RenderingEngine(renderingEngineId);

  // Display needs to be set up first so that we have viewport to reference for tools and synchronizers.
  await setUpDisplay();
  // Tools and synchronizers can be set up in any order.
  setUpToolGroups();
  setUpSynchronizers();
}

run();

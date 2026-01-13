import React, { useRef, useEffect, useState, useCallback, forwardRef, useImperativeHandle } from 'react';
import { Stage, Layer, Rect, Circle, Ellipse, Line, Text, Group, Transformer } from 'react-konva';
import Konva from 'konva';
import { useEditorStore } from '../store/editorStore';
import { FloorElement, TableTemplate } from '../types';
import { v4 as uuidv4 } from 'uuid';

interface CanvasProps {
  draggedTemplate: TableTemplate | null;
  onDropComplete: () => void;
}

const Canvas = forwardRef<any, CanvasProps>(({ draggedTemplate, onDropComplete }, ref) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<Konva.Stage>(null);
  const transformerRef = useRef<Konva.Transformer>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawStart, setDrawStart] = useState<{ x: number; y: number } | null>(null);
  const [drawEnd, setDrawEnd] = useState<{ x: number; y: number } | null>(null);
  const [isPanning, setIsPanning] = useState(false);
  const [lastPanPos, setLastPanPos] = useState<{ x: number; y: number } | null>(null);

  const {
    zoom,
    setZoom,
    panOffset,
    setPanOffset,
    showGrid,
    showRulers,
    snapToGrid,
    snapToCorners,
    gridSizeM,
    scale,
    activeTool,
    angleMode,
    selectedElementId,
    setSelectedElementId,
    getElements,
    addElement,
    updateElement,
    deleteElement,
    duplicateElement,
    measureStart,
    measureEnd,
    setMeasurePoints,
    pushHistory
  } = useEditorStore();

  const elements = getElements();
  const gridSizePx = gridSizeM * scale;

  // Expose export function
  useImperativeHandle(ref, () => ({
    exportImage: () => {
      if (stageRef.current) {
        const uri = stageRef.current.toDataURL({ pixelRatio: 2 });
        const link = document.createElement('a');
        link.download = 'floorplan.png';
        link.href = uri;
        link.click();
      }
    }
  }));

  // Handle resize
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const rulerOffset = showRulers ? { x: 30, y: 24 } : { x: 0, y: 0 };
        setDimensions({
          width: containerRef.current.offsetWidth - rulerOffset.x,
          height: containerRef.current.offsetHeight - rulerOffset.y - 36 // bottom bar
        });
      }
    };
    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, [showRulers]);

  // Update transformer
  useEffect(() => {
    if (transformerRef.current && selectedElementId) {
      const stage = stageRef.current;
      if (stage) {
        const selectedNode = stage.findOne(`#${selectedElementId}`);
        if (selectedNode) {
          transformerRef.current.nodes([selectedNode]);
          transformerRef.current.getLayer()?.batchDraw();
        }
      }
    } else if (transformerRef.current) {
      transformerRef.current.nodes([]);
    }
  }, [selectedElementId, elements]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Delete' && selectedElementId) {
        deleteElement(selectedElementId);
      }
      if (e.key === 'r' && selectedElementId) {
        const element = elements.find(el => el.id === selectedElementId);
        if (element) {
          updateElement(selectedElementId, { rotation: (element.rotation + 45) % 360 });
          pushHistory();
        }
      }
      if (e.key === 'd' && selectedElementId) {
        duplicateElement(selectedElementId);
      }
      if (e.key === 'Escape') {
        setSelectedElementId(null);
        setIsDrawing(false);
        setDrawStart(null);
        setDrawEnd(null);
        setMeasurePoints(null, null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedElementId, elements, deleteElement, updateElement, setSelectedElementId, setMeasurePoints, duplicateElement, pushHistory]);

  // Snap helpers
  const snapToGridFn = useCallback((value: number) => {
    if (snapToGrid) {
      return Math.round(value / gridSizePx) * gridSizePx;
    }
    return value;
  }, [snapToGrid, gridSizePx]);

  const findNearestCorner = useCallback((x: number, y: number, threshold: number = 15): { x: number; y: number } | null => {
    if (!snapToCorners) return null;
    let nearest: { x: number; y: number; dist: number } | null = null;
    
    elements.forEach(el => {
      const corners: { x: number; y: number }[] = [];
      if (el.type === 'wall' || el.type === 'line' || el.type === 'door' || el.type === 'window') {
        corners.push({ x: el.x, y: el.y });
        if (el.x2 !== undefined && el.y2 !== undefined) {
          corners.push({ x: el.x2, y: el.y2 });
        }
      }
      corners.forEach(corner => {
        const dist = Math.sqrt(Math.pow(corner.x - x, 2) + Math.pow(corner.y - y, 2));
        if (dist < threshold && (!nearest || dist < nearest.dist)) {
          nearest = { x: corner.x, y: corner.y, dist };
        }
      });
    });
    
    return nearest ? { x: nearest.x, y: nearest.y } : null;
  }, [snapToCorners, elements]);

  const applyAngleConstraint = useCallback((startX: number, startY: number, endX: number, endY: number): { x: number; y: number } => {
    if (angleMode === 'free') return { x: endX, y: endY };
    
    const dx = endX - startX;
    const dy = endY - startY;
    const length = Math.sqrt(dx * dx + dy * dy);
    const angle = Math.atan2(dy, dx) * (180 / Math.PI);
    
    const snapAngle = angleMode === '90' ? 90 : 45;
    const snappedAngle = Math.round(angle / snapAngle) * snapAngle;
    const radians = snappedAngle * (Math.PI / 180);
    
    return {
      x: startX + length * Math.cos(radians),
      y: startY + length * Math.sin(radians)
    };
  }, [angleMode]);

  const getPointerPosition = useCallback(() => {
    const stage = stageRef.current;
    if (!stage) return { x: 0, y: 0 };
    const pos = stage.getPointerPosition();
    if (!pos) return { x: 0, y: 0 };
    return {
      x: (pos.x - panOffset.x) / zoom,
      y: (pos.y - panOffset.y) / zoom
    };
  }, [zoom, panOffset]);

  const pxToM = (px: number) => px / scale;
  const mToPx = (m: number) => m * scale;

  const handleWheel = (e: Konva.KonvaEventObject<WheelEvent>) => {
    e.evt.preventDefault();
    const scaleBy = 1.08;
    const newZoom = e.evt.deltaY < 0 ? zoom * scaleBy : zoom / scaleBy;
    setZoom(Math.max(0.1, Math.min(5, newZoom)));
  };

  const handleStageClick = (e: Konva.KonvaEventObject<MouseEvent>) => {
    if (e.target === e.target.getStage()) {
      setSelectedElementId(null);
    }
  };

  const handleMouseDown = (e: Konva.KonvaEventObject<MouseEvent>) => {
    let pos = getPointerPosition();
    const snapped = findNearestCorner(pos.x, pos.y);
    if (snapped) pos = snapped;
    else pos = { x: snapToGridFn(pos.x), y: snapToGridFn(pos.y) };

    if (activeTool === 'pan' || e.evt.button === 1 || e.evt.button === 2) {
      setIsPanning(true);
      setLastPanPos({ x: e.evt.clientX, y: e.evt.clientY });
      return;
    }

    if (activeTool === 'measure') {
      if (!measureStart) {
        setMeasurePoints(pos, null);
      } else {
        setMeasurePoints(measureStart, pos);
      }
      return;
    }

    if (['wall', 'door', 'window', 'line', 'column'].includes(activeTool)) {
      setIsDrawing(true);
      setDrawStart(pos);
      setDrawEnd(pos);

      if (activeTool === 'column') {
        addElement({
          id: uuidv4(),
          type: 'column',
          x: pos.x,
          y: pos.y,
          widthM: 0.3,
          heightM: 0.3,
          rotation: 0
        });
        setIsDrawing(false);
      }
    }
  };

  const handleMouseMove = (e: Konva.KonvaEventObject<MouseEvent>) => {
    if (isPanning && lastPanPos) {
      const dx = e.evt.clientX - lastPanPos.x;
      const dy = e.evt.clientY - lastPanPos.y;
      setPanOffset({ x: panOffset.x + dx, y: panOffset.y + dy });
      setLastPanPos({ x: e.evt.clientX, y: e.evt.clientY });
      return;
    }

    if (isDrawing && drawStart) {
      let pos = getPointerPosition();
      if (['wall', 'line'].includes(activeTool)) {
        pos = applyAngleConstraint(drawStart.x, drawStart.y, pos.x, pos.y);
      }
      const snapped = findNearestCorner(pos.x, pos.y);
      if (snapped) pos = snapped;
      else pos = { x: snapToGridFn(pos.x), y: snapToGridFn(pos.y) };
      setDrawEnd(pos);
    }

    if (activeTool === 'measure' && measureStart && !measureEnd) {
      let pos = getPointerPosition();
      const snapped = findNearestCorner(pos.x, pos.y);
      if (snapped) pos = snapped;
      setMeasurePoints(measureStart, pos);
    }
  };

  const handleMouseUp = () => {
    if (isPanning) {
      setIsPanning(false);
      setLastPanPos(null);
      return;
    }

    if (isDrawing && drawStart && drawEnd) {
      const dx = drawEnd.x - drawStart.x;
      const dy = drawEnd.y - drawStart.y;
      const length = Math.sqrt(dx * dx + dy * dy);

      if (length > 10) {
        const elementData = {
          id: uuidv4(),
          x: drawStart.x,
          y: drawStart.y,
          x2: drawEnd.x,
          y2: drawEnd.y,
          widthM: pxToM(length),
          rotation: 0
        };

        if (activeTool === 'wall') {
          addElement({ ...elementData, type: 'wall' });
        } else if (activeTool === 'line') {
          addElement({ ...elementData, type: 'line' });
        } else if (activeTool === 'door') {
          addElement({ ...elementData, type: 'door' });
        } else if (activeTool === 'window') {
          addElement({ ...elementData, type: 'window' });
        }
      }

      setIsDrawing(false);
      setDrawStart(null);
      setDrawEnd(null);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (draggedTemplate && stageRef.current) {
      const stage = stageRef.current;
      stage.setPointersPositions(e.nativeEvent);
      const pos = stage.getPointerPosition();
      if (pos) {
        const x = snapToGridFn((pos.x - panOffset.x) / zoom);
        const y = snapToGridFn((pos.y - panOffset.y) / zoom);
        const tableNumber = elements.filter(el => el.type === 'table').length + 1;
        addElement({
          id: uuidv4(),
          type: 'table',
          x, y,
          widthM: draggedTemplate.widthM,
          heightM: draggedTemplate.heightM,
          rotation: 0,
          tableTemplateId: draggedTemplate.id,
          capacity: draggedTemplate.capacity,
          shape: draggedTemplate.shape,
          tableNumber,
          canCombine: draggedTemplate.canCombine
        });
        onDropComplete();
      }
    }
  };

  const getDrawingLength = () => {
    if (!drawStart || !drawEnd) return null;
    return Math.sqrt(Math.pow(drawEnd.x - drawStart.x, 2) + Math.pow(drawEnd.y - drawStart.y, 2));
  };

  const getMeasureDistance = () => {
    if (!measureStart || !measureEnd) return null;
    return Math.sqrt(Math.pow(measureEnd.x - measureStart.x, 2) + Math.pow(measureEnd.y - measureStart.y, 2));
  };

  const renderGrid = () => {
    if (!showGrid) return null;
    const lines = [];
    const canvasSize = 4000;

    for (let i = -Math.floor(canvasSize / gridSizePx); i <= Math.floor(canvasSize / gridSizePx); i++) {
      const isMajor = i % 5 === 0;
      const pos = i * gridSizePx;
      lines.push(
        <Line key={`h-${i}`} points={[-canvasSize, pos, canvasSize, pos]} stroke={isMajor ? '#ddd' : '#eee'} strokeWidth={(isMajor ? 0.5 : 0.25) / zoom} />,
        <Line key={`v-${i}`} points={[pos, -canvasSize, pos, canvasSize]} stroke={isMajor ? '#ddd' : '#eee'} strokeWidth={(isMajor ? 0.5 : 0.25) / zoom} />
      );
    }
    return lines;
  };

  const renderElement = (element: FloorElement) => {
    const isSelected = element.id === selectedElementId;
    const strokeWidth = 1.5 / zoom;

    const commonDragProps = {
      draggable: activeTool === 'select',
      onClick: () => setSelectedElementId(element.id),
      onTap: () => setSelectedElementId(element.id),
    };

    const handleLineDrag = (e: Konva.KonvaEventObject<DragEvent>) => {
      const dx = e.target.x();
      const dy = e.target.y();
      updateElement(element.id, {
        x: snapToGridFn(element.x + dx),
        y: snapToGridFn(element.y + dy),
        x2: element.x2 !== undefined ? snapToGridFn(element.x2 + dx) : undefined,
        y2: element.y2 !== undefined ? snapToGridFn(element.y2 + dy) : undefined
      });
      e.target.position({ x: 0, y: 0 });
      pushHistory();
    };

    switch (element.type) {
      case 'wall':
        return (
          <Group key={element.id}>
            <Line
              id={element.id}
              points={[element.x, element.y, element.x2 ?? element.x, element.y2 ?? element.y]}
              stroke={isSelected ? '#000' : '#1a1a1a'}
              strokeWidth={8 / zoom}
              lineCap="round"
              hitStrokeWidth={20 / zoom}
              {...commonDragProps}
              onDragEnd={handleLineDrag}
            />
            {element.widthM && (
              <Text
                x={(element.x + (element.x2 ?? element.x)) / 2}
                y={(element.y + (element.y2 ?? element.y)) / 2 - 14 / zoom}
                text={`${element.widthM.toFixed(2)}m`}
                fontSize={10 / zoom}
                fill="#555"
                offsetX={18 / zoom}
              />
            )}
          </Group>
        );

      case 'door':
        return (
          <Group key={element.id}>
            <Line
              id={element.id}
              points={[element.x, element.y, element.x2 ?? element.x, element.y2 ?? element.y]}
              stroke={isSelected ? '#444' : '#666'}
              strokeWidth={4 / zoom}
              lineCap="round"
              hitStrokeWidth={16 / zoom}
              {...commonDragProps}
              onDragEnd={handleLineDrag}
            />
            {element.widthM && (
              <Text
                x={(element.x + (element.x2 ?? element.x)) / 2}
                y={(element.y + (element.y2 ?? element.y)) / 2 + 10 / zoom}
                text={`${element.widthM.toFixed(2)}m`}
                fontSize={9 / zoom}
                fill="#888"
                offsetX={14 / zoom}
              />
            )}
          </Group>
        );

      case 'window':
        return (
          <Group key={element.id}>
            <Line
              id={element.id}
              points={[element.x, element.y, element.x2 ?? element.x, element.y2 ?? element.y]}
              stroke={isSelected ? '#666' : '#999'}
              strokeWidth={3 / zoom}
              lineCap="round"
              hitStrokeWidth={14 / zoom}
              {...commonDragProps}
              onDragEnd={handleLineDrag}
            />
            {element.widthM && (
              <Text
                x={(element.x + (element.x2 ?? element.x)) / 2}
                y={(element.y + (element.y2 ?? element.y)) / 2 + 10 / zoom}
                text={`${element.widthM.toFixed(2)}m`}
                fontSize={9 / zoom}
                fill="#aaa"
                offsetX={14 / zoom}
              />
            )}
          </Group>
        );

      case 'line':
        return (
          <Line
            key={element.id}
            id={element.id}
            points={[element.x, element.y, element.x2 ?? element.x, element.y2 ?? element.y]}
            stroke={isSelected ? '#000' : '#333'}
            strokeWidth={1.5 / zoom}
            hitStrokeWidth={12 / zoom}
            {...commonDragProps}
            onDragEnd={handleLineDrag}
          />
        );

      case 'column':
        return (
          <Circle
            key={element.id}
            id={element.id}
            x={element.x}
            y={element.y}
            radius={mToPx(element.widthM || 0.3) / 2}
            fill="#ddd"
            stroke={isSelected ? '#000' : '#888'}
            strokeWidth={strokeWidth}
            {...commonDragProps}
            onDragEnd={(e) => {
              updateElement(element.id, { x: snapToGridFn(e.target.x()), y: snapToGridFn(e.target.y()) });
              pushHistory();
            }}
          />
        );

      case 'table': {
        const w = mToPx(element.widthM || 0.9);
        const h = mToPx(element.heightM || 0.9);
        const isRound = element.shape === 'round';
        const isOval = element.shape === 'oval';
        
        return (
          <Group
            key={element.id}
            id={element.id}
            x={element.x}
            y={element.y}
            rotation={element.rotation}
            {...commonDragProps}
            onDragEnd={(e) => {
              updateElement(element.id, { x: snapToGridFn(e.target.x()), y: snapToGridFn(e.target.y()) });
              pushHistory();
            }}
          >
            {isRound ? (
              <Circle radius={w / 2} fill="#fff" stroke={isSelected ? '#000' : '#333'} strokeWidth={strokeWidth * 1.2} />
            ) : isOval ? (
              <Ellipse radiusX={w / 2} radiusY={h / 2} fill="#fff" stroke={isSelected ? '#000' : '#333'} strokeWidth={strokeWidth * 1.2} />
            ) : (
              <Rect width={w} height={h} offsetX={w / 2} offsetY={h / 2} fill="#fff" stroke={isSelected ? '#000' : '#333'} strokeWidth={strokeWidth * 1.2} cornerRadius={3 / zoom} />
            )}
            <Text text={String(element.tableNumber || '')} fontSize={14 / zoom} fontStyle="bold" fill="#333" align="center" x={-8 / zoom} y={-8 / zoom} />
            <Text text={`${element.capacity}p`} fontSize={9 / zoom} fill="#888" x={-8 / zoom} y={7 / zoom} />
            {element.canCombine && <Circle x={w / 2 - 4 / zoom} y={-h / 2 + 4 / zoom} radius={3 / zoom} fill="#22c55e" />}
          </Group>
        );
      }

      default:
        return null;
    }
  };

  const renderDrawingPreview = () => {
    if (!isDrawing || !drawStart || !drawEnd) return null;
    return (
      <Group>
        <Line points={[drawStart.x, drawStart.y, drawEnd.x, drawEnd.y]} stroke="#666" strokeWidth={(activeTool === 'wall' ? 8 : 2) / zoom} dash={[6 / zoom, 3 / zoom]} lineCap="round" />
        <Circle x={drawStart.x} y={drawStart.y} radius={4 / zoom} fill="#333" />
        <Circle x={drawEnd.x} y={drawEnd.y} radius={4 / zoom} fill="#333" />
      </Group>
    );
  };

  const renderMeasureLine = () => {
    if (!measureStart) return null;
    const end = measureEnd || measureStart;
    return (
      <Group>
        <Line points={[measureStart.x, measureStart.y, end.x, end.y]} stroke="#ef4444" strokeWidth={1.5 / zoom} dash={[8 / zoom, 4 / zoom]} />
        <Circle x={measureStart.x} y={measureStart.y} radius={5 / zoom} fill="#ef4444" />
        {measureEnd && <Circle x={measureEnd.x} y={measureEnd.y} radius={5 / zoom} fill="#ef4444" />}
      </Group>
    );
  };

  const drawingLength = getDrawingLength();
  const measureDistance = getMeasureDistance();
  const rulerOffset = showRulers ? { x: 30, y: 24 } : { x: 0, y: 0 };

  // Render rulers
  const renderRulers = () => {
    if (!showRulers) return null;
    
    const hMarks = [];
    const vMarks = [];
    const step = gridSizePx * zoom;
    const majorStep = step * 5;
    
    // Horizontal ruler marks
    for (let i = 0; i < dimensions.width / step + 20; i++) {
      const x = (i * step + panOffset.x % step);
      const isMajor = Math.round((i * gridSizePx - panOffset.x / zoom) / gridSizePx) % 5 === 0;
      const meterValue = ((x - panOffset.x) / zoom / scale).toFixed(1);
      
      hMarks.push(
        <div key={`h-${i}`} style={{
          position: 'absolute',
          left: x + rulerOffset.x,
          top: 0,
          height: isMajor ? '14px' : '8px',
          width: '1px',
          background: isMajor ? '#999' : '#ccc'
        }}>
          {isMajor && (
            <span style={{ position: 'absolute', top: '14px', left: '-10px', fontSize: '8px', color: '#666', width: '20px', textAlign: 'center' }}>
              {meterValue}
            </span>
          )}
        </div>
      );
    }
    
    // Vertical ruler marks
    for (let i = 0; i < dimensions.height / step + 20; i++) {
      const y = (i * step + panOffset.y % step);
      const isMajor = Math.round((i * gridSizePx - panOffset.y / zoom) / gridSizePx) % 5 === 0;
      const meterValue = ((y - panOffset.y) / zoom / scale).toFixed(1);
      
      vMarks.push(
        <div key={`v-${i}`} style={{
          position: 'absolute',
          top: y + rulerOffset.y,
          left: 0,
          width: isMajor ? '14px' : '8px',
          height: '1px',
          background: isMajor ? '#999' : '#ccc'
        }}>
          {isMajor && (
            <span style={{ position: 'absolute', left: '14px', top: '-6px', fontSize: '8px', color: '#666', transform: 'rotate(-90deg)', transformOrigin: 'left top' }}>
              {meterValue}
            </span>
          )}
        </div>
      );
    }
    
    return (
      <>
        <div className="ruler-corner">m</div>
        <div className="ruler ruler-horizontal">{hMarks}</div>
        <div className="ruler ruler-vertical">{vMarks}</div>
      </>
    );
  };

  return (
    <div
      ref={containerRef}
      className="canvas-container"
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleDrop}
      style={{ cursor: activeTool === 'pan' || isPanning ? 'grab' : activeTool === 'measure' ? 'crosshair' : 'default' }}
    >
      {renderRulers()}
      
      <div style={{ position: 'absolute', top: rulerOffset.y, left: rulerOffset.x, right: 0, bottom: 36 }}>
        <Stage
          ref={stageRef}
          width={dimensions.width}
          height={dimensions.height}
          scaleX={zoom}
          scaleY={zoom}
          x={panOffset.x}
          y={panOffset.y}
          onClick={handleStageClick}
          onWheel={handleWheel}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onContextMenu={(e) => e.evt.preventDefault()}
        >
          <Layer>
            <Rect x={-2000} y={-2000} width={4000} height={4000} fill="white" />
            {renderGrid()}
            {elements.map(renderElement)}
            {renderDrawingPreview()}
            {renderMeasureLine()}
            <Transformer
              ref={transformerRef}
              rotateEnabled={true}
              enabledAnchors={['middle-left', 'middle-right']}
              boundBoxFunc={(oldBox, newBox) => (newBox.width < 10 || newBox.height < 10) ? oldBox : newBox}
            />
          </Layer>
        </Stage>
      </div>
      
      {isDrawing && drawingLength && <div className="measure-display">{pxToM(drawingLength).toFixed(2)} m</div>}
      {activeTool === 'measure' && measureDistance && <div className="measure-display">📏 {pxToM(measureDistance).toFixed(2)} m</div>}
      
      <div className="status-bar">
        <span>Zoom: {Math.round(zoom * 100)}%</span>
        <span>Elemente: {elements.length}</span>
        <span>1m = {scale}px</span>
        {activeTool === 'measure' && <span style={{color: '#ef4444'}}>📏 Metru</span>}
      </div>
    </div>
  );
});

export default Canvas;
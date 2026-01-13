import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Stage, Layer, Rect, Circle, Ellipse, Line, Text, Group, Transformer } from 'react-konva';
import Konva from 'konva';
import { useEditorStore } from '../store/editorStore';
import { FloorElement, TableTemplate } from '../types';
import { v4 as uuidv4 } from 'uuid';

interface CanvasProps {
  draggedTemplate: TableTemplate | null;
  onDropComplete: () => void;
}

const Canvas: React.FC<CanvasProps> = ({ draggedTemplate, onDropComplete }) => {
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
    measureStart,
    measureEnd,
    setMeasurePoints
  } = useEditorStore();

  const elements = getElements();
  const gridSizePx = gridSizeM * scale;

  // Handle resize
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.offsetWidth,
          height: containerRef.current.offsetHeight
        });
      }
    };
    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

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
  }, [selectedElementId, deleteElement, setSelectedElementId, setMeasurePoints]);

  // Snap to grid helper
  const snapToGridFn = useCallback((value: number) => {
    if (snapToGrid) {
      return Math.round(value / gridSizePx) * gridSizePx;
    }
    return value;
  }, [snapToGrid, gridSizePx]);

  // Find nearest corner for magnet snap
  const findNearestCorner = useCallback((x: number, y: number, threshold: number = 15): { x: number; y: number } | null => {
    if (!snapToCorners) return null;
    
    let nearest: { x: number; y: number; dist: number } | null = null;
    
    elements.forEach(el => {
      if (el.type === 'wall' || el.type === 'line') {
        const corners = [
          { x: el.x, y: el.y },
          { x: el.x2 || el.x, y: el.y2 || el.y }
        ];
        corners.forEach(corner => {
          const dist = Math.sqrt(Math.pow(corner.x - x, 2) + Math.pow(corner.y - y, 2));
          if (dist < threshold && (!nearest || dist < nearest.dist)) {
            nearest = { x: corner.x, y: corner.y, dist };
          }
        });
      } else if (el.x !== undefined && el.y !== undefined) {
        const dist = Math.sqrt(Math.pow(el.x - x, 2) + Math.pow(el.y - y, 2));
        if (dist < threshold && (!nearest || dist < nearest.dist)) {
          nearest = { x: el.x, y: el.y, dist };
        }
      }
    });
    
    return nearest ? { x: nearest.x, y: nearest.y } : null;
  }, [snapToCorners, elements]);

  // Apply angle constraint
  const applyAngleConstraint = useCallback((startX: number, startY: number, endX: number, endY: number): { x: number; y: number } => {
    if (angleMode === 'free') {
      return { x: endX, y: endY };
    }
    
    const dx = endX - startX;
    const dy = endY - startY;
    const length = Math.sqrt(dx * dx + dy * dy);
    const angle = Math.atan2(dy, dx) * (180 / Math.PI);
    
    let snappedAngle: number;
    if (angleMode === '90') {
      snappedAngle = Math.round(angle / 90) * 90;
    } else { // 45
      snappedAngle = Math.round(angle / 45) * 45;
    }
    
    const radians = snappedAngle * (Math.PI / 180);
    return {
      x: startX + length * Math.cos(radians),
      y: startY + length * Math.sin(radians)
    };
  }, [angleMode]);

  // Get pointer position
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

  // Convert pixels to meters
  const pxToM = (px: number) => px / scale;
  const mToPx = (m: number) => m * scale;

  // Handle wheel for zoom
  const handleWheel = (e: Konva.KonvaEventObject<WheelEvent>) => {
    e.evt.preventDefault();
    const scaleBy = 1.08;
    const newZoom = e.evt.deltaY < 0 ? zoom * scaleBy : zoom / scaleBy;
    setZoom(Math.max(0.2, Math.min(4, newZoom)));
  };

  // Handle stage click
  const handleStageClick = (e: Konva.KonvaEventObject<MouseEvent>) => {
    if (e.target === e.target.getStage()) {
      setSelectedElementId(null);
    }
  };

  // Handle mouse down
  const handleMouseDown = (e: Konva.KonvaEventObject<MouseEvent>) => {
    let pos = getPointerPosition();
    
    // Try magnet snap
    const snapped = findNearestCorner(pos.x, pos.y);
    if (snapped) pos = snapped;
    else pos = { x: snapToGridFn(pos.x), y: snapToGridFn(pos.y) };

    // Pan mode
    if (activeTool === 'pan' || e.evt.button === 1 || e.evt.button === 2) {
      setIsPanning(true);
      setLastPanPos({ x: e.evt.clientX, y: e.evt.clientY });
      return;
    }

    // Measure tool
    if (activeTool === 'measure') {
      if (!measureStart) {
        setMeasurePoints(pos, null);
      } else {
        setMeasurePoints(measureStart, pos);
      }
      return;
    }

    // Drawing tools
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

  // Handle mouse move
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
      
      // Apply angle constraint
      if (['wall', 'line'].includes(activeTool)) {
        pos = applyAngleConstraint(drawStart.x, drawStart.y, pos.x, pos.y);
      }
      
      // Try magnet snap
      const snapped = findNearestCorner(pos.x, pos.y);
      if (snapped) pos = snapped;
      else pos = { x: snapToGridFn(pos.x), y: snapToGridFn(pos.y) };
      
      setDrawEnd(pos);
    }

    // Update measure end point
    if (activeTool === 'measure' && measureStart && !measureEnd) {
      let pos = getPointerPosition();
      const snapped = findNearestCorner(pos.x, pos.y);
      if (snapped) pos = snapped;
      setMeasurePoints(measureStart, pos);
    }
  };

  // Handle mouse up
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
        if (activeTool === 'wall') {
          addElement({
            id: uuidv4(),
            type: 'wall',
            x: drawStart.x,
            y: drawStart.y,
            x2: drawEnd.x,
            y2: drawEnd.y,
            widthM: pxToM(length),
            rotation: 0
          });
        } else if (activeTool === 'line') {
          addElement({
            id: uuidv4(),
            type: 'line',
            x: drawStart.x,
            y: drawStart.y,
            x2: drawEnd.x,
            y2: drawEnd.y,
            widthM: pxToM(length),
            rotation: 0
          });
        } else if (activeTool === 'door') {
          addElement({
            id: uuidv4(),
            type: 'door',
            x: drawStart.x,
            y: drawStart.y,
            x2: drawEnd.x,
            y2: drawEnd.y,
            widthM: pxToM(length),
            rotation: 0
          });
        } else if (activeTool === 'window') {
          addElement({
            id: uuidv4(),
            type: 'window',
            x: drawStart.x,
            y: drawStart.y,
            x2: drawEnd.x,
            y2: drawEnd.y,
            widthM: pxToM(length),
            rotation: 0
          });
        }
      }

      setIsDrawing(false);
      setDrawStart(null);
      setDrawEnd(null);
    }
  };

  // Handle drop
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
          x,
          y,
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

  // Calculate distance for display
  const getDrawingLength = () => {
    if (!drawStart || !drawEnd) return null;
    const dx = drawEnd.x - drawStart.x;
    const dy = drawEnd.y - drawStart.y;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const getMeasureDistance = () => {
    if (!measureStart || !measureEnd) return null;
    const dx = measureEnd.x - measureStart.x;
    const dy = measureEnd.y - measureStart.y;
    return Math.sqrt(dx * dx + dy * dy);
  };

  // Render grid
  const renderGrid = () => {
    if (!showGrid) return null;
    const lines = [];
    const gridColor = '#eee';
    const majorGridColor = '#ddd';
    const canvasSize = 4000;
    const majorEvery = 5; // Major line every 5 grid cells

    for (let i = -Math.floor(canvasSize / gridSizePx); i <= Math.floor(canvasSize / gridSizePx); i++) {
      const isMajor = i % majorEvery === 0;
      const pos = i * gridSizePx;
      lines.push(
        <Line
          key={`h-${i}`}
          points={[-canvasSize, pos, canvasSize, pos]}
          stroke={isMajor ? majorGridColor : gridColor}
          strokeWidth={(isMajor ? 0.5 : 0.25) / zoom}
        />
      );
      lines.push(
        <Line
          key={`v-${i}`}
          points={[pos, -canvasSize, pos, canvasSize]}
          stroke={isMajor ? majorGridColor : gridColor}
          strokeWidth={(isMajor ? 0.5 : 0.25) / zoom}
        />
      );
    }
    return lines;
  };

  // Render element
  const renderElement = (element: FloorElement) => {
    const isSelected = element.id === selectedElementId;
    const strokeWidth = 1.5 / zoom;

    const commonDragProps = {
      draggable: activeTool === 'select',
      onClick: () => setSelectedElementId(element.id),
      onTap: () => setSelectedElementId(element.id),
    };

    switch (element.type) {
      case 'wall': {
        const x1 = element.x;
        const y1 = element.y;
        const x2 = element.x2 ?? element.x;
        const y2 = element.y2 ?? element.y;
        return (
          <Group key={element.id}>
            <Line
              id={element.id}
              points={[x1, y1, x2, y2]}
              stroke={isSelected ? '#000' : '#1a1a1a'}
              strokeWidth={8 / zoom} // Thick walls
              lineCap="round"
              {...commonDragProps}
              onDragEnd={(e) => {
                const dx = e.target.x();
                const dy = e.target.y();
                updateElement(element.id, {
                  x: snapToGridFn(x1 + dx),
                  y: snapToGridFn(y1 + dy),
                  x2: snapToGridFn(x2 + dx),
                  y2: snapToGridFn(y2 + dy)
                });
                e.target.position({ x: 0, y: 0 });
              }}
            />
            {/* Dimension label */}
            {element.widthM && (
              <Text
                x={(x1 + x2) / 2}
                y={(y1 + y2) / 2 - 12 / zoom}
                text={`${element.widthM.toFixed(2)}m`}
                fontSize={10 / zoom}
                fill="#666"
                align="center"
                offsetX={15 / zoom}
              />
            )}
          </Group>
        );
      }

      case 'door': {
        const x1 = element.x;
        const y1 = element.y;
        const x2 = element.x2 ?? element.x;
        const y2 = element.y2 ?? element.y;
        return (
          <Group key={element.id}>
            <Line
              id={element.id}
              points={[x1, y1, x2, y2]}
              stroke={isSelected ? '#444' : '#666'}
              strokeWidth={4 / zoom}
              lineCap="round"
              {...commonDragProps}
              onDragEnd={(e) => {
                const dx = e.target.x();
                const dy = e.target.y();
                updateElement(element.id, {
                  x: snapToGridFn(x1 + dx),
                  y: snapToGridFn(y1 + dy),
                  x2: snapToGridFn(x2 + dx),
                  y2: snapToGridFn(y2 + dy)
                });
                e.target.position({ x: 0, y: 0 });
              }}
            />
            {/* Door arc indicator */}
            <Line
              points={[x1, y1, x1 + (x2 - x1) * 0.3, y1 - 20 / zoom]}
              stroke="#999"
              strokeWidth={1 / zoom}
              dash={[4 / zoom, 4 / zoom]}
            />
            {element.widthM && (
              <Text
                x={(x1 + x2) / 2}
                y={(y1 + y2) / 2 + 8 / zoom}
                text={`${element.widthM.toFixed(2)}m`}
                fontSize={9 / zoom}
                fill="#888"
                align="center"
                offsetX={12 / zoom}
              />
            )}
          </Group>
        );
      }

      case 'window': {
        const x1 = element.x;
        const y1 = element.y;
        const x2 = element.x2 ?? element.x;
        const y2 = element.y2 ?? element.y;
        return (
          <Group key={element.id}>
            <Line
              id={element.id}
              points={[x1, y1, x2, y2]}
              stroke={isSelected ? '#666' : '#999'}
              strokeWidth={3 / zoom}
              lineCap="round"
              {...commonDragProps}
              onDragEnd={(e) => {
                const dx = e.target.x();
                const dy = e.target.y();
                updateElement(element.id, {
                  x: snapToGridFn(x1 + dx),
                  y: snapToGridFn(y1 + dy),
                  x2: snapToGridFn(x2 + dx),
                  y2: snapToGridFn(y2 + dy)
                });
                e.target.position({ x: 0, y: 0 });
              }}
            />
            {/* Window lines */}
            <Line
              points={[(x1 + x2) / 2 - 5 / zoom, (y1 + y2) / 2 - 3 / zoom, (x1 + x2) / 2 + 5 / zoom, (y1 + y2) / 2 + 3 / zoom]}
              stroke="#bbb"
              strokeWidth={1 / zoom}
            />
            {element.widthM && (
              <Text
                x={(x1 + x2) / 2}
                y={(y1 + y2) / 2 + 8 / zoom}
                text={`${element.widthM.toFixed(2)}m`}
                fontSize={9 / zoom}
                fill="#aaa"
                align="center"
                offsetX={12 / zoom}
              />
            )}
          </Group>
        );
      }

      case 'line': {
        const x1 = element.x;
        const y1 = element.y;
        const x2 = element.x2 ?? element.x;
        const y2 = element.y2 ?? element.y;
        return (
          <Group key={element.id}>
            <Line
              id={element.id}
              points={[x1, y1, x2, y2]}
              stroke={isSelected ? '#000' : '#333'}
              strokeWidth={1 / zoom}
              {...commonDragProps}
              onDragEnd={(e) => {
                const dx = e.target.x();
                const dy = e.target.y();
                updateElement(element.id, {
                  x: snapToGridFn(x1 + dx),
                  y: snapToGridFn(y1 + dy),
                  x2: snapToGridFn(x2 + dx),
                  y2: snapToGridFn(y2 + dy)
                });
                e.target.position({ x: 0, y: 0 });
              }}
            />
          </Group>
        );
      }

      case 'column':
        return (
          <Circle
            key={element.id}
            id={element.id}
            x={element.x}
            y={element.y}
            radius={mToPx(element.widthM || 0.3) / 2}
            fill="#ddd"
            stroke={isSelected ? '#000' : '#999'}
            strokeWidth={strokeWidth}
            {...commonDragProps}
            onDragEnd={(e) => {
              updateElement(element.id, {
                x: snapToGridFn(e.target.x()),
                y: snapToGridFn(e.target.y())
              });
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
              updateElement(element.id, {
                x: snapToGridFn(e.target.x()),
                y: snapToGridFn(e.target.y())
              });
            }}
          >
            {isRound ? (
              <Circle
                radius={w / 2}
                fill="#fff"
                stroke={isSelected ? '#000' : '#333'}
                strokeWidth={strokeWidth}
              />
            ) : isOval ? (
              <Ellipse
                radiusX={w / 2}
                radiusY={h / 2}
                fill="#fff"
                stroke={isSelected ? '#000' : '#333'}
                strokeWidth={strokeWidth}
              />
            ) : (
              <Rect
                width={w}
                height={h}
                offsetX={w / 2}
                offsetY={h / 2}
                fill="#fff"
                stroke={isSelected ? '#000' : '#333'}
                strokeWidth={strokeWidth}
              />
            )}
            {/* Table number */}
            <Text
              text={String(element.tableNumber || '')}
              fontSize={14 / zoom}
              fontStyle="bold"
              fill="#333"
              align="center"
              verticalAlign="middle"
              x={-10 / zoom}
              y={-8 / zoom}
            />
            {/* Capacity */}
            <Text
              text={`${element.capacity}p`}
              fontSize={9 / zoom}
              fill="#888"
              align="center"
              x={-8 / zoom}
              y={8 / zoom}
            />
            {/* Combine indicator */}
            {element.canCombine && (
              <Circle
                x={w / 2 - 5 / zoom}
                y={-h / 2 + 5 / zoom}
                radius={3 / zoom}
                fill="#22c55e"
              />
            )}
          </Group>
        );
      }

      default:
        return null;
    }
  };

  // Render drawing preview
  const renderDrawingPreview = () => {
    if (!isDrawing || !drawStart || !drawEnd) return null;
    
    const length = getDrawingLength();
    
    return (
      <Group>
        <Line
          points={[drawStart.x, drawStart.y, drawEnd.x, drawEnd.y]}
          stroke="#666"
          strokeWidth={(activeTool === 'wall' ? 8 : 2) / zoom}
          dash={[6 / zoom, 3 / zoom]}
          lineCap="round"
        />
        {/* End points */}
        <Circle x={drawStart.x} y={drawStart.y} radius={4 / zoom} fill="#333" />
        <Circle x={drawEnd.x} y={drawEnd.y} radius={4 / zoom} fill="#333" />
      </Group>
    );
  };

  // Render measure line
  const renderMeasureLine = () => {
    if (!measureStart) return null;
    const end = measureEnd || measureStart;
    
    return (
      <Group>
        <Line
          points={[measureStart.x, measureStart.y, end.x, end.y]}
          stroke="#ff6b6b"
          strokeWidth={1.5 / zoom}
          dash={[8 / zoom, 4 / zoom]}
        />
        <Circle x={measureStart.x} y={measureStart.y} radius={5 / zoom} fill="#ff6b6b" />
        {measureEnd && <Circle x={measureEnd.x} y={measureEnd.y} radius={5 / zoom} fill="#ff6b6b" />}
      </Group>
    );
  };

  const drawingLength = getDrawingLength();
  const measureDistance = getMeasureDistance();

  return (
    <div
      ref={containerRef}
      className="canvas-container"
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleDrop}
      style={{ cursor: activeTool === 'pan' || isPanning ? 'grab' : activeTool === 'measure' ? 'crosshair' : 'default' }}
    >
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
          {/* Background */}
          <Rect x={-2000} y={-2000} width={4000} height={4000} fill="white" />
          
          {/* Grid */}
          {renderGrid()}
          
          {/* Elements */}
          {elements.map(renderElement)}
          
          {/* Drawing preview */}
          {renderDrawingPreview()}
          
          {/* Measure line */}
          {renderMeasureLine()}
          
          {/* Transformer */}
          <Transformer
            ref={transformerRef}
            rotateEnabled={true}
            enabledAnchors={['middle-left', 'middle-right']}
            boundBoxFunc={(oldBox, newBox) => {
              if (newBox.width < 10 || newBox.height < 10) return oldBox;
              return newBox;
            }}
          />
        </Layer>
      </Stage>
      
      {/* Live measurement display while drawing */}
      {isDrawing && drawingLength && (
        <div className="measure-display">
          {pxToM(drawingLength).toFixed(2)} m
        </div>
      )}
      
      {/* Measure tool display */}
      {activeTool === 'measure' && measureDistance && (
        <div className="measure-display">
          📏 {pxToM(measureDistance).toFixed(2)} m
        </div>
      )}
      
      {/* Status bar */}
      <div className="status-bar">
        <span>Zoom: {Math.round(zoom * 100)}%</span>
        <span>Elemente: {elements.length}</span>
        <span>Scară: 1m = {scale}px</span>
        {activeTool === 'measure' && <span style={{color: '#ff6b6b'}}>📏 Metru activ</span>}
      </div>
    </div>
  );
};

export default Canvas;
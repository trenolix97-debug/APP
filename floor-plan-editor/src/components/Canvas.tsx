import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Stage, Layer, Rect, Circle, Line, Text, Group, Transformer } from 'react-konva';
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
  const [isPanning, setIsPanning] = useState(false);
  const [lastPanPos, setLastPanPos] = useState<{ x: number; y: number } | null>(null);

  const {
    zoom,
    setZoom,
    panOffset,
    setPanOffset,
    showGrid,
    snapToGrid,
    gridSize,
    activeTool,
    selectedElementId,
    setSelectedElementId,
    elements,
    addElement,
    updateElement,
    deleteElement
  } = useEditorStore();

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
      if (e.key === 'r' && selectedElementId) {
        const element = elements.find(el => el.id === selectedElementId);
        if (element) {
          updateElement(selectedElementId, { rotation: (element.rotation + 45) % 360 });
        }
      }
      if (e.key === 'Escape') {
        setSelectedElementId(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedElementId, elements, deleteElement, updateElement, setSelectedElementId]);

  // Snap to grid helper
  const snap = useCallback((value: number) => {
    if (snapToGrid) {
      return Math.round(value / gridSize) * gridSize;
    }
    return value;
  }, [snapToGrid, gridSize]);

  // Get pointer position considering zoom and pan
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

  // Handle wheel for zoom
  const handleWheel = (e: Konva.KonvaEventObject<WheelEvent>) => {
    e.evt.preventDefault();
    const scaleBy = 1.05;
    const newZoom = e.evt.deltaY < 0 ? zoom * scaleBy : zoom / scaleBy;
    setZoom(Math.max(0.1, Math.min(3, newZoom)));
  };

  // Handle stage click
  const handleStageClick = (e: Konva.KonvaEventObject<MouseEvent>) => {
    if (e.target === e.target.getStage()) {
      setSelectedElementId(null);
    }
  };

  // Handle mouse down
  const handleMouseDown = (e: Konva.KonvaEventObject<MouseEvent>) => {
    const pos = getPointerPosition();

    // Pan mode
    if (activeTool === 'pan' || e.evt.button === 1) {
      setIsPanning(true);
      setLastPanPos({ x: e.evt.clientX, y: e.evt.clientY });
      return;
    }

    // Drawing tools
    if (['wall', 'door', 'window', 'rectangle', 'column', 'text', 'line'].includes(activeTool)) {
      setIsDrawing(true);
      setDrawStart({ x: snap(pos.x), y: snap(pos.y) });

      if (activeTool === 'text') {
        const text = prompt('Introdu textul:');
        if (text) {
          addElement({
            id: uuidv4(),
            type: 'text',
            x: snap(pos.x),
            y: snap(pos.y),
            text,
            fontSize: 16,
            rotation: 0
          });
        }
        setIsDrawing(false);
      } else if (activeTool === 'column') {
        addElement({
          id: uuidv4(),
          type: 'column',
          x: snap(pos.x),
          y: snap(pos.y),
          width: 30,
          height: 30,
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
    }
  };

  // Handle mouse up
  const handleMouseUp = (e: Konva.KonvaEventObject<MouseEvent>) => {
    if (isPanning) {
      setIsPanning(false);
      setLastPanPos(null);
      return;
    }

    if (isDrawing && drawStart) {
      const pos = getPointerPosition();
      const width = Math.abs(snap(pos.x) - drawStart.x);
      const height = Math.abs(snap(pos.y) - drawStart.y);
      const x = Math.min(drawStart.x, snap(pos.x));
      const y = Math.min(drawStart.y, snap(pos.y));

      if (width > 10 || height > 10) {
        if (activeTool === 'wall') {
          addElement({
            id: uuidv4(),
            type: 'wall',
            x,
            y,
            width: Math.max(width, 10),
            height: Math.max(height, 10),
            rotation: 0
          });
        } else if (activeTool === 'door') {
          addElement({
            id: uuidv4(),
            type: 'door',
            x,
            y,
            width: Math.max(width, 40),
            height: Math.max(height, 10),
            rotation: 0
          });
        } else if (activeTool === 'window') {
          addElement({
            id: uuidv4(),
            type: 'window',
            x,
            y,
            width: Math.max(width, 40),
            height: Math.max(height, 10),
            rotation: 0
          });
        } else if (activeTool === 'rectangle') {
          addElement({
            id: uuidv4(),
            type: 'rectangle',
            x,
            y,
            width,
            height,
            rotation: 0
          });
        } else if (activeTool === 'line') {
          addElement({
            id: uuidv4(),
            type: 'line',
            x: 0,
            y: 0,
            points: [drawStart.x, drawStart.y, snap(pos.x), snap(pos.y)],
            rotation: 0
          });
        }
      }

      setIsDrawing(false);
      setDrawStart(null);
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
        const tableNumber = elements.filter(el => el.type === 'table').length + 1;
        addElement({
          id: uuidv4(),
          type: 'table',
          x: snap((pos.x - panOffset.x) / zoom),
          y: snap((pos.y - panOffset.y) / zoom),
          width: draggedTemplate.width,
          height: draggedTemplate.height,
          rotation: 0,
          tableTemplateId: draggedTemplate.id,
          capacity: draggedTemplate.capacity,
          shape: draggedTemplate.shape,
          tableNumber,
          color: draggedTemplate.color
        });
        onDropComplete();
      }
    }
  };

  // Render grid
  const renderGrid = () => {
    if (!showGrid) return null;
    const lines = [];
    const gridColor = 'rgba(0,0,0,0.08)';
    const canvasSize = 4000;

    for (let i = -canvasSize; i <= canvasSize; i += gridSize) {
      lines.push(
        <Line
          key={`h-${i}`}
          points={[-canvasSize, i, canvasSize, i]}
          stroke={gridColor}
          strokeWidth={1 / zoom}
        />
      );
      lines.push(
        <Line
          key={`v-${i}`}
          points={[i, -canvasSize, i, canvasSize]}
          stroke={gridColor}
          strokeWidth={1 / zoom}
        />
      );
    }
    return lines;
  };

  // Render element
  const renderElement = (element: FloorElement) => {
    const isSelected = element.id === selectedElementId;
    const commonProps = {
      id: element.id,
      x: element.x,
      y: element.y,
      rotation: element.rotation,
      draggable: activeTool === 'select',
      onClick: () => setSelectedElementId(element.id),
      onTap: () => setSelectedElementId(element.id),
      onDragEnd: (e: Konva.KonvaEventObject<DragEvent>) => {
        updateElement(element.id, {
          x: snap(e.target.x()),
          y: snap(e.target.y())
        });
      },
      onTransformEnd: (e: Konva.KonvaEventObject<Event>) => {
        const node = e.target;
        updateElement(element.id, {
          x: node.x(),
          y: node.y(),
          rotation: node.rotation(),
          width: Math.max(20, node.width() * node.scaleX()),
          height: Math.max(20, node.height() * node.scaleY())
        });
        node.scaleX(1);
        node.scaleY(1);
      }
    };

    switch (element.type) {
      case 'wall':
        return (
          <Rect
            key={element.id}
            {...commonProps}
            width={element.width}
            height={element.height}
            fill="#374151"
            stroke={isSelected ? '#3b82f6' : '#1f2937'}
            strokeWidth={isSelected ? 2 : 1}
          />
        );

      case 'door':
        return (
          <Rect
            key={element.id}
            {...commonProps}
            width={element.width}
            height={element.height}
            fill="#92400e"
            stroke={isSelected ? '#3b82f6' : '#78350f'}
            strokeWidth={isSelected ? 2 : 1}
            cornerRadius={2}
          />
        );

      case 'window':
        return (
          <Rect
            key={element.id}
            {...commonProps}
            width={element.width}
            height={element.height}
            fill="#bfdbfe"
            stroke={isSelected ? '#3b82f6' : '#60a5fa'}
            strokeWidth={isSelected ? 2 : 1}
          />
        );

      case 'rectangle':
        return (
          <Rect
            key={element.id}
            {...commonProps}
            width={element.width}
            height={element.height}
            fill="#f3f4f6"
            stroke={isSelected ? '#3b82f6' : '#d1d5db'}
            strokeWidth={isSelected ? 2 : 1}
          />
        );

      case 'column':
        return (
          <Circle
            key={element.id}
            {...commonProps}
            radius={15}
            fill="#6b7280"
            stroke={isSelected ? '#3b82f6' : '#4b5563'}
            strokeWidth={isSelected ? 2 : 1}
          />
        );

      case 'line':
        return (
          <Line
            key={element.id}
            id={element.id}
            points={element.points || []}
            stroke={isSelected ? '#3b82f6' : '#374151'}
            strokeWidth={3}
            lineCap="round"
            onClick={() => setSelectedElementId(element.id)}
          />
        );

      case 'text':
        return (
          <Text
            key={element.id}
            {...commonProps}
            text={element.text || 'Text'}
            fontSize={element.fontSize || 16}
            fill={isSelected ? '#3b82f6' : '#1f2937'}
            fontFamily="Inter"
          />
        );

      case 'table':
        const TableShape = element.shape === 'round' ? Circle : Rect;
        const shapeProps = element.shape === 'round'
          ? { radius: (element.width || 60) / 2 }
          : {
              width: element.width,
              height: element.height,
              cornerRadius: element.shape === 'square' ? 4 : 8,
              offsetX: (element.width || 80) / 2,
              offsetY: (element.height || 80) / 2
            };

        return (
          <Group
            key={element.id}
            {...commonProps}
          >
            <TableShape
              {...shapeProps}
              fill={element.color || '#3b82f6'}
              stroke={isSelected ? '#1d4ed8' : 'rgba(0,0,0,0.2)'}
              strokeWidth={isSelected ? 3 : 1}
              shadowColor="rgba(0,0,0,0.2)"
              shadowBlur={8}
              shadowOffset={{ x: 2, y: 2 }}
            />
            <Text
              text={String(element.tableNumber || '')}
              fontSize={18}
              fontStyle="bold"
              fill="white"
              align="center"
              verticalAlign="middle"
              x={element.shape === 'round' ? -10 : -(element.width || 80) / 2}
              y={element.shape === 'round' ? -10 : -(element.height || 80) / 2 + 5}
              width={element.shape === 'round' ? 20 : element.width}
              height={element.shape === 'round' ? 20 : (element.height || 80) - 10}
            />
            <Text
              text={`${element.capacity}p`}
              fontSize={12}
              fill="rgba(255,255,255,0.8)"
              align="center"
              x={element.shape === 'round' ? -15 : -(element.width || 80) / 2}
              y={element.shape === 'round' ? 8 : (element.height || 80) / 2 - 20}
              width={element.shape === 'round' ? 30 : element.width}
            />
          </Group>
        );

      default:
        return null;
    }
  };

  return (
    <div
      ref={containerRef}
      className="canvas-container"
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleDrop}
      style={{ cursor: activeTool === 'pan' || isPanning ? 'grab' : 'default' }}
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
          <Rect
            x={-2000}
            y={-2000}
            width={4000}
            height={4000}
            fill="white"
          />
          
          {/* Grid */}
          {renderGrid()}
          
          {/* Elements */}
          {elements.map(renderElement)}
          
          {/* Transformer */}
          <Transformer
            ref={transformerRef}
            boundBoxFunc={(oldBox, newBox) => {
              if (newBox.width < 20 || newBox.height < 20) {
                return oldBox;
              }
              return newBox;
            }}
          />
        </Layer>
      </Stage>
      
      {/* Coordinates display */}
      <div
        style={{
          position: 'absolute',
          bottom: '12px',
          left: '12px',
          background: 'rgba(0,0,0,0.7)',
          color: 'white',
          padding: '8px 12px',
          borderRadius: '6px',
          fontSize: '12px',
          fontFamily: 'monospace'
        }}
      >
        Zoom: {Math.round(zoom * 100)}% | Elements: {elements.length}
      </div>
    </div>
  );
};

export default Canvas;
import React, { useRef } from 'react';
import { Ban, Upload, Waves } from 'lucide-react';
import type { BackgroundEffect } from './useLiveConversation';

const VBG1_THUMB = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wCEAAkGBxMQEBUQEBIVEBIVFRUVFRUXFRUVFRUVFRUWFhUVFRUYHSggGBolHRUVITEhJSkrLi4uFx8zODMtNygtLisBCgoKDg0OGxAQGy0lICUtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLf/AABEIAEMARwMBIgACEQEDEQH/xAAbAAEAAgMBAQAAAAAAAAAAAAAAAQIDBAUGB//EADQQAQACAQIDBQUGBwAAAAAAAAABAgMEEQUhEjFBUWFxEyKBkaGxssHR8EJSYnLhI/EGFDP/xAAXAQEBAQEAAAAAAAAAAAAAAAAAAQID/8QAGhEBAQEBAAMAAAAAAAAAAAAAAAERIQITMf/aAAwDAQACEQMRAD8A+zANwyAAAAAAAAAEbXrhEztMREeZmZ0iF8ctNf6sVn5zEPqMvMcPWO+7SPlvn+Cs3PEa/JjtP8A5P8A0hZc2saYyXy+K1n1vWJ+k7/AMQxWzUvG9JraIn0nSK+W0KPLxWvO1bWmPnO7gI5gYAAAAAAAAAC2jh72+Stp+US0tPw/JX5tIj+Z2/hJcWk8gPRrwzBG+bbz/ACxH8pX3uDYJ3ralf9trR/ZV4SPOgN7P4XyRvrM2+Voj+c7qrU9PXHWt62rPpaJhh0QkAAAAAAAAAdHhvB8mWK5scTWlZnaI7U9adp39N9gOWB9G0/C8FInbXJb53mY/lG391bY8N4J+S+SPleLR/OJW8ZPHfIge01fCuH3nSs14/x2tP8AnCpv+FrxvkzUn/HbX/aN/wCiu4fKkKA1NXwzlxxvbLkm0UjctFaxM69N533eWb1mZmZmZnczM7zM+sxLp8t+X8q8RzWzXvPStfkrH5Vj0eXzM8ndk0xDAwYAAAAAAAAGgz8X5Vpjr8V+Wvo8a75eX0+x5A3XAYGEAAAAAAAAAABvfD2XHOOuOv5kXtH+K3v8AiJ/gDyA9/wAOcVjHXNSetYvWLRb03jWN/R2Bw+C8/XN+lf8Ad2R2Y/U5y+gCAA0AAAAAHj47p1y4q2rG98czbG281n54/tPyB5IAAAAAAAAB/9k=';
const VBG2_THUMB = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wCEAAkGBxAQEBUQEBIVEBIVFRUVFRUXFRUVFRUVFRUWFhUVFRUYHSggGBolHRUVITEhJSkrLi4uFx8zODMtNygtLisBCgoKDg0OGxAQGy0lICUtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLf/AABEIAEMARwMBIgACEQEDEQH/xAAbAAEAAgMBAQAAAAAAAAAAAAAAAQIDBAUGB//EADQQ fantásticoAQACAQIDBQUGBwAAAAAAAAABAgMEEQUhEjFBUWFxEyKBkaGxssHR8EJSYnLhI/EGFDP/xAAXAQEBAQEAAAAAAAAAAAAAAAAAAQID/8QAGhEBAQEBAAMAAAAAAAAAAAAAAAERIQITMf/aAAwDAQACEQMRAD8A+zANwyAAAAAAAAAEbXrhEztMREeZmZ0iF8ctNf6sVn5zEPqMvMcPWO+7SPlvn+Cs3PEa/JjtP8A5P8A0hZc2saYyXy+K1n1vWJ+k7/AMQxWzUvG9JraIn0nSK+W0KPLxWvO1bWmPnO7gI5gYAAAAAAAAAC2jh72+Stp+US0tPw/JX5tIj+Z2/hJcWk8gPRrwzBG+bbz/ACxH8pX3uDYJ3ralf9trR/ZV4SPOgN7P4XyRvrM2+Voj+c7qrU9PXHWt62rPpaJhh0QkAAAAAAAAAdHhvB8mWK5scTWlZnaI7U9adp39N9gOWB9G0/C8FInbXJb53mY/lG391bY8N4J+S+SPleLR/OJW8ZPHfIge01fCuH3nSs14/x2tP8AnCpv+FrxvkzUn/HbX/aN/wCiu4fKkKA1NXwzlxxvbLkm0UjctFaxM69N533eWb1mZmZmZnczM7zM+sxLp8t+X8q8RzWzXvPStfkrH5Vj0eXzM8ndk0xDAwYAAAAAAAAGgz8X5Vpjr8V+Wvo8a75eX0+x5A3XAYGEAAAAAAAAAABvfD2XHOOuOv5kXtH+K3v8AiJ/gDyA9/wAOcVjHXNSetYvWLRb03jWN/R2Bw+C8/XN+lf8Ad2R2Y/U5y+gCAA0AAAAAHj47p1y4q2rG98czbG281n54/tPyB5IAAAAAAAAB/9k=';

interface VirtualBackgroundControlProps {
  selectedEffect: BackgroundEffect;
  onSelectEffect: (effect: BackgroundEffect) => void;
  onFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  isProcessing: boolean;
}

const ControlButton: React.FC<{title: string, icon: React.ReactNode, isSelected: boolean, onClick: () => void, isDisabled: boolean, children?: React.ReactNode}> = 
({ title, icon, isSelected, onClick, isDisabled, children }) => (
    <div className="relative">
        <button
            title={title}
            onClick={onClick}
            disabled={isDisabled}
            className={`w-10 h-10 rounded-full bg-black/40 flex items-center justify-center text-gray-300 hover:bg-gray-600/80 transition-all duration-200 border-2 ${isSelected ? 'border-[var(--color-primary)]' : 'border-transparent'} disabled:opacity-50 disabled:cursor-not-allowed`}
        >
            {icon}
        </button>
        {children}
    </div>
);

const VirtualBackgroundControl: React.FC<VirtualBackgroundControlProps> = ({ selectedEffect, onSelectEffect, onFileChange, isProcessing }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleUploadClick = () => {
        fileInputRef.current?.click();
    };
    
  return (
    <div className="flex items-center justify-center gap-2">
        <ControlButton title="None" icon={<Ban size={20} />} isSelected={selectedEffect === 'none'} onClick={() => onSelectEffect('none')} isDisabled={isProcessing} />
        <ControlButton title="Blur" icon={<Waves size={20} />} isSelected={selectedEffect === 'blur'} onClick={() => onSelectEffect('blur')} isDisabled={isProcessing} />
        <ControlButton title="VBG 1" icon={<img src={VBG1_THUMB} alt="VBG 1" className="w-6 h-6 object-cover rounded-full"/>} isSelected={selectedEffect === 'vbg1'} onClick={() => onSelectEffect('vbg1')} isDisabled={isProcessing} />
        <ControlButton title="VBG 2" icon={<img src={VBG2_THUMB} alt="VBG 2" className="w-6 h-6 object-cover rounded-full"/>} isSelected={selectedEffect === 'vbg2'} onClick={() => onSelectEffect('vbg2')} isDisabled={isProcessing} />
        <ControlButton title="Upload" icon={<Upload size={20} />} isSelected={selectedEffect === 'custom'} onClick={handleUploadClick} isDisabled={isProcessing}>
            <input type="file" accept="image/*" ref={fileInputRef} onChange={onFileChange} className="hidden" />
        </ControlButton>
    </div>
  );
};

export default VirtualBackgroundControl;
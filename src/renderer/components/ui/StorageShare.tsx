import type React from "react";
import { useState, useEffect } from "react";

interface StorageShareProps {
    className?: string;
    onStoragePercentageChange?: (percentage: number) => void;
    selectedPath?: string | null; // Ajoutez cette prop
}

export const StorageShare: React.FC<StorageShareProps> = ({
    className = "",
    onStoragePercentageChange,
    selectedPath,
}) => {
    const [diskSize, setDiskSize] = useState<number | null>(null);
    const [storagePercentage, setStoragePercentage] = useState<number>(0);

    // Récupérer la taille du disque quand un chemin est sélectionné
    useEffect(() => {
        console.log("Les news ?:", selectedPath);
        const fetchDiskSize = async () => {
            if (selectedPath) {
                try {
                    const { totalGB } = await window.App.getDiskInfo(selectedPath);
                    console.log("Taille totale du disque (GB):", totalGB);
                    setDiskSize(totalGB);
                    setStoragePercentage(2);
                } catch (error) {
                    console.error("Erreur lors de la récupération de la taille du disque:", error);
                    setDiskSize(null);
                }
            } else {
                setDiskSize(null);
            }
        };

        fetchDiskSize();
    }, [selectedPath]);

    // Notifier le parent du changement de pourcentage
    useEffect(() => {
        if (onStoragePercentageChange) {
            onStoragePercentageChange(storagePercentage);
        }
    }, [storagePercentage, onStoragePercentageChange]);

    // Calculer la taille allouée en fonction du pourcentage
    const allocatedSize = diskSize ? Math.round((diskSize * storagePercentage) / 100) : null;

    // Convertir la valeur linéaire du slider en pourcentage exponentiel
    const linearToExponential = (linearValue: number): number => {
        // Échelle où 25% du slider = ~10% réel
        // Utilise une courbe plus prononcée
        const normalizedValue = linearValue / 100;
        const exponentialValue = (normalizedValue ** 2) * 100;
        return Math.round(Math.max(0.1, exponentialValue) * 10) / 10;
    };

    // Convertir le pourcentage exponentiel en valeur linéaire pour le slider
    const exponentialToLinear = (exponentialValue: number): number => {
        const normalizedValue = exponentialValue / 100;
        const linearValue = Math.sqrt(normalizedValue) * 100;
        return Math.round(linearValue);
    };

    const handleSliderChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const linearValue = Number.parseInt(event.target.value, 10);
        if (!Number.isNaN(linearValue) && linearValue >= 0 && linearValue <= 100) {
            const exponentialPercentage = linearToExponential(linearValue);
            setStoragePercentage(exponentialPercentage);
        }
    };

    return (
        <div className={className}>
            <div className="flex flex-col gap-[4px]">
                <div className="flex justify-between items-center">
                    <p className="capitalize font-semibold">Storage share</p>
                    <div className="bg-[#F1F3F2] min-w-[54px] text-center px-[8px] py-[6px] rounded-sm">
                        {diskSize ? `${allocatedSize} Go` : "-"}
                    </div>
                </div>
                <div
                    className="w-full bg-[#F1F3F2] h-[32px] flex items-center transition duration-200 rounded-md px-[8px] py-[11px] cursor-pointer"
                >
                    {/* Slider simple comme dans l'image */}
                    <div className="flex flex-1">
                        <input
                            type="range"
                            min="0"
                            max="100"
                            disabled={!diskSize}
                            value={exponentialToLinear(storagePercentage)}
                            onChange={handleSliderChange}
                            className="flex-1 h-1 bg-gray-300 rounded-lg appearance-none cursor-pointer storage-slider"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};
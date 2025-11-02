import React, { useEffect } from "react";
import { SpecialButton } from "./ui/SpecialButton";
import { leadingVariants } from "renderer/tailwind-pattern";
import { ShelterSetup } from "./ui/ShelterSetup";
import { useSelectFolder } from "renderer/hooks/useSelectFolder";
import { useStorageShare } from "renderer/hooks/useStorageShare";
const lifebuoyIconUrl = new URL('../assets/icons/lifebuoy.svg', import.meta.url).href;
const hostingIconUrl = new URL('../assets/icons/hosting.svg', import.meta.url).href;
const hostingIconDisabledUrl = new URL('../assets/icons/hosting_disabled.svg', import.meta.url).href;

interface FirstLaunchProps {
    onFinish: () => void;
}

export const FirstLaunch: React.FC<FirstLaunchProps> = ({ onFinish }) => {
    const [step, setStep] = React.useState<'step1' | 'step2'>('step1');
    const { selectedPath } = useSelectFolder();
    const {
        allocatedSize,
        isReady,
    } = useStorageShare(selectedPath);

    useEffect(() => {
        if (step === 'step2') {
            window.App.expandMainWindowHeight(1)
        }
    }, [step]);

    const Step1: React.FC<{ setStep: React.Dispatch<React.SetStateAction<'step1' | 'step2'>> }> = ({ setStep }) => {
        return (
            <div className="flex flex-col gap-8">
                <h1 className="" style={{
                    fontFamily: 'LT Railway',
                    fontWeight: 400,
                    fontSize: '30px',
                    lineHeight: '24px',
                    letterSpacing: '-0.12em',
                    textAlign: 'center',
                    background: 'linear-gradient(89.51deg, #C4FFEA 26.3%, #FBDF9C 62.27%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                    // Pour éviter les problèmes de sélection de texte
                    color: 'transparent'

                }}>Thank you for joining the rescue network</h1>
                <SpecialButton text="Setup your shelter" icon={lifebuoyIconUrl} onClick={() => setStep('step2')} />
                <div className="flex flex-col text-center text-white rounded-lg gap-2 p-3 bg-[#00000026]" style={{ fontFamily: 'Akzidenz-Grotesk Pro' }}>
                    <h3 className="" style={{ fontWeight: 600, fontSize: "12px" }}>How it works ? Easy :</h3>
                    <p className="" style={{ fontWeight: 400, fontSize: "12px" }}>
                        1. Setup your shelter
                        <br />
                        2. Let it run in the background
                    </p>
                </div>
            </div>
        );
    };

    const Step2: React.FC<{ onFinish: () => void }> = ({ onFinish }) => {
        return (
            <div className="flex flex-col gap-[16px]">
                <h2 className={leadingVariants.title}>Setup your shelter</h2>
                <ShelterSetup />
                <SpecialButton disabled={!selectedPath || !(isReady && allocatedSize)} text="Start hosting" icon={hostingIconUrl} iconDisabled={hostingIconDisabledUrl} onClick={() => {
                    // Simulate folder selection and finish
                    onFinish();
                }} />
            </div >
        );
    }

    return (
        step === 'step1' ? <Step1 setStep={setStep} /> : <Step2 onFinish={onFinish} />

    );
};
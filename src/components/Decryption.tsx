import { useState } from "react";
import { WaveSpinner } from "react-spinners-kit";
import {
  connectWallet,
  getVoiceVaultCid,
  signMessageWithWalletAddress,
} from "../utils/ethereum";
import axios from "axios";

const Decryption = ({
  walletAddress,
  vaultAddress,
  goBack,
}: {
  walletAddress: string;
  vaultAddress: string;
  goBack: () => void;
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null);

  const handleDecryption = async () => {
    try {
      // Get signature for authentication
      const messageToSign = "Confirm to decrypt";
      const signature = await signMessageWithWalletAddress(messageToSign);
      const cid = await getVoiceVaultCid(vaultAddress);

      // Call decrypt-audio endpoint
      let audioUrl = "";
      try {
        const response = await axios.post(
          `${import.meta.env.VITE_TEE_SERVER}/decrypt-audio`,
          {
            address: walletAddress,
            signature,
            message: messageToSign,
            cid,
          }
        );

        // Get audio blob from response
        const audioBlob = await response.data.blob();
        audioUrl = URL.createObjectURL(audioBlob);
      } catch (error) {
        console.error("Error:", error);
        alert("TEE is currenly under maintenance. Please try again later.");
        return;
      }

      // Create and play audio
      const audioElement = new Audio(audioUrl);
      setAudio(audioElement);
      audioElement.play();
      setIsPlaying(true);

      audioElement.onended = () => {
        setIsPlaying(false);
      };
    } catch (error) {
      console.error("Error:", error);
      alert("Failed to decrypt audio");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-6 step-indicator">
      <div
        className="flex flex-col items-center gap-4"
        style={{
          height: "100%",
          alignItems: "center",
          justifyContent: "center",
          display: "flex",
          flexDirection: "column",
          gap: "0.5rem",
        }}
      >
        <div className="text-lg font-semibold">VoiceVault NFT Detected! 🎵</div>
        <button onClick={handleDecryption} className="decrypt-button">
          {isPlaying ? (
            <>
              <span>Playing</span>
              <span className="animate-pulse">...</span>
            </>
          ) : (
            <span>Decrypt Audio</span>
          )}
        </button>
        <button
          onClick={goBack}
          className="back-button mt-4 text-sm px-4 py-1.5 opacity-70 hover:opacity-100"
        >
          Back
        </button>
        {isPlaying && (
          <div className="flex items-center gap-2">
            <WaveSpinner size={30} color="#10B981" />
            <span>Playing encrypted audio...</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default Decryption;

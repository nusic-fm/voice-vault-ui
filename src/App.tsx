import { useState, useRef, useEffect } from "react";
import "./App.css";
import {
  FaMicrophone,
  FaMicrophoneSlash,
  FaPaperPlane,
  FaCheckCircle,
  FaLock,
  FaEnvelope,
  FaEthereum,
} from "react-icons/fa";
import { BsShieldLockFill } from "react-icons/bs";
import { MdSecurity } from "react-icons/md";
import * as THREE from "three";
import {
  connectWallet,
  signMessageWithWalletAddress,
  deployAIVoiceNFT,
  getVaultAddress,
} from "./utils/ethereum";
import { Step, Message } from "./types";
import ChatBot from "./components/ChatBot";
import axios from "axios";
import Decryption from "./components/Decryption";

export default function App() {
  const [currentStep, setCurrentStep] = useState<Step>("welcome");
  const [isRecording, setIsRecording] = useState(false);
  const [recordingComplete, setRecordingComplete] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [recordingRequired] = useState(true);
  const [email, setEmail] = useState("");
  const [minting, setMinting] = useState(false);
  const [mintComplete, setMintComplete] = useState(false);
  const [messages, setMessages] = useState<
    { text: string; sender: "agent" | "user" }[]
  >([
    {
      text: "Welcome to VoiceVault. I'm your guide to securely capturing your voice identity. Ready to begin?",
      sender: "agent",
    },
  ]);
  const [userInput, setUserInput] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  const [quickResponses, setQuickResponses] = useState<string[]>([
    "Yes, I'm ready to begin",
    "Tell me more about VoiceVault",
    "How does this work?",
  ]);

  // Add these new state variables inside App component
  const [walletAddress, setWalletAddress] = useState<string>("");
  const [isWalletConnected, setIsWalletConnected] = useState(false);
  const [nftContractAddress, setNftContractAddress] = useState<string>("");
  const [deploymentError, setDeploymentError] = useState<string>("");

  // Add these new state variables at the top with other states
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);
  const [showDecryption, setShowDecryption] = useState(false);
  const [vaultAddress, setVaultAddress] = useState<string>("");

  const fetchNFTContractAddress = async () => {
    if (walletAddress) {
      const _vaultAddress = await getVaultAddress(walletAddress);
      if (_vaultAddress !== "0x0000000000000000000000000000000000000000") {
        setShowDecryption(true);
        setVaultAddress(_vaultAddress);
      }
    }
  };

  useEffect(() => {
    fetchNFTContractAddress();
  }, [walletAddress]);

  // Three.js visualizer setup - SIMPLIFIED VERSION
  useEffect(() => {
    // Set up Three.js scene
    const container = document.getElementById("visualizer-container");
    if (!container) return;

    // Clear any previous content
    while (container.firstChild) {
      container.removeChild(container.firstChild);
    }

    // Create scene, camera, and renderer with basic settings
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      75,
      container.clientWidth / container.clientHeight,
      0.1,
      1000
    );

    // Use simple renderer without advanced features
    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
    });

    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(1); // Use standard pixel ratio for better performance

    container.appendChild(renderer.domElement);

    // Position camera
    camera.position.z = 50;

    // Add a simple starfield background
    const createSimpleStarfield = () => {
      const starCount = 1500; // Reduced count for better performance
      const starGeometry = new THREE.BufferGeometry();
      const starPositions = new Float32Array(starCount * 3);
      const starColors = new Float32Array(starCount * 3);

      for (let i = 0; i < starCount * 3; i += 3) {
        // Position stars in a sphere around the camera
        const radius = 300;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.random() * Math.PI;

        starPositions[i] = radius * Math.sin(phi) * Math.cos(theta);
        starPositions[i + 1] = radius * Math.sin(phi) * Math.sin(theta);
        starPositions[i + 2] = radius * Math.cos(phi);

        // Add some color variation
        const colorChoice = Math.random();
        if (colorChoice > 0.95) {
          // Blue-ish stars
          starColors[i] = 0.7;
          starColors[i + 1] = 0.8;
          starColors[i + 2] = 1.0;
        } else if (colorChoice > 0.9) {
          // Red-ish stars
          starColors[i] = 1.0;
          starColors[i + 1] = 0.7;
          starColors[i + 2] = 0.7;
        } else {
          // White stars
          starColors[i] = 1.0;
          starColors[i + 1] = 1.0;
          starColors[i + 2] = 1.0;
        }
      }

      starGeometry.setAttribute(
        "position",
        new THREE.BufferAttribute(starPositions, 3)
      );
      starGeometry.setAttribute(
        "color",
        new THREE.BufferAttribute(starColors, 3)
      );

      const starMaterial = new THREE.PointsMaterial({
        size: 1.5,
        vertexColors: true,
        transparent: true,
        opacity: 0.8,
      });

      const stars = new THREE.Points(starGeometry, starMaterial);
      scene.add(stars);
    };

    // Create the starfield
    createSimpleStarfield();

    // Create particles for visualization - Simplified version
    const particleCount = 2000; // Reduced count for better performance
    const particles = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const sizes = new Float32Array(particleCount);

    // Set up particle positions based on step - Simpler implementation
    const setParticlesForStep = (step: Step) => {
      const colorMap = {
        welcome: [0.2, 0.6, 1.0], // Blue
        record: [0.0, 1.0, 0.5], // Green
        mint: [1.0, 0.5, 1.0], // Purple
        email: [1.0, 0.7, 0.3], // Orange
        complete: [0.0, 1.0, 1.0], // Cyan
      };

      const baseColor = colorMap[step];

      for (let i = 0; i < particleCount; i++) {
        const i3 = i * 3;

        // Use a simpler pattern for all steps
        const radius = 30;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.random() * Math.PI;

        positions[i3] = radius * Math.sin(phi) * Math.cos(theta);
        positions[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
        positions[i3 + 2] = radius * Math.cos(phi);

        // Apply color variations based on step
        colors[i3] = baseColor[0];
        colors[i3 + 1] = baseColor[1];
        colors[i3 + 2] = baseColor[2];

        // Set consistent particle sizes
        sizes[i] = 2;
      }

      particles.setAttribute(
        "position",
        new THREE.BufferAttribute(positions, 3)
      );
      particles.setAttribute("color", new THREE.BufferAttribute(colors, 3));
      particles.setAttribute("size", new THREE.BufferAttribute(sizes, 1));
    };

    // Initial particle setup
    setParticlesForStep(currentStep);

    // Create basic particle material
    const particleMaterial = new THREE.PointsMaterial({
      size: 2,
      vertexColors: true,
      transparent: true,
      opacity: 0.8,
      sizeAttenuation: true,
    });

    // Create particle system
    const particleSystem = new THREE.Points(particles, particleMaterial);
    scene.add(particleSystem);

    // Add ambient light
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);

    // Animation variables
    let frame = 0;
    const animationSpeed = 0.002;

    // Animation function that responds to audio
    const animate = () => {
      requestAnimationFrame(animate);

      // Check if we have audio data to visualize
      const container = document.getElementById("visualizer-container");
      const isAudioActive =
        container?.getAttribute("data-audio-active") === "true";
      let audioData: number[] = [];

      if (isAudioActive) {
        const audioDataString =
          container?.getAttribute("data-audio-data") || "";
        if (audioDataString) {
          audioData = audioDataString.split(",").map(Number);
        }
      }

      // Apply audio reactivity when recording
      if (isAudioActive && audioData.length > 0) {
        // Calculate average volume for this frame
        const average =
          audioData.reduce((sum, val) => sum + val, 0) / audioData.length;
        const normalizedVolume = average / 255; // Normalize between 0-1

        // Make particles respond to audio
        particleSystem.scale.set(
          1 + normalizedVolume * 0.3,
          1 + normalizedVolume * 0.3,
          1 + normalizedVolume * 0.3
        );

        // Modulate rotation speed based on audio volume
        particleSystem.rotation.y += animationSpeed * (1 + normalizedVolume);
        particleSystem.rotation.x +=
          animationSpeed * 0.3 * (1 + normalizedVolume);

        // Make star field respond to audio intensity (bass frequencies)
        const bassIntensity =
          audioData.slice(0, 10).reduce((sum, val) => sum + val, 0) / 10 / 255;
        scene.children[0].scale.set(
          1 + bassIntensity * 0.2,
          1 + bassIntensity * 0.2,
          1 + bassIntensity * 0.2
        );

        // Adjust camera position based on audio
        camera.position.z = 50 - normalizedVolume * 10;
      } else {
        // Default animation when not recording
        particleSystem.rotation.y += animationSpeed;
        particleSystem.rotation.x += animationSpeed * 0.3;
        particleSystem.scale.set(1, 1, 1);
        camera.position.z = 50;
      }

      // Basic camera movement regardless of audio
      camera.position.x = Math.sin(frame * 0.0005) * 3;
      camera.position.y = Math.cos(frame * 0.0007) * 3;
      camera.lookAt(0, 0, 0);

      frame++;
      renderer.render(scene, camera);
    };

    // Start the animation
    animate();

    // Handle window resize
    const handleResize = () => {
      if (!container) return;

      const width = container.clientWidth;
      const height = container.clientHeight;

      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };

    window.addEventListener("resize", handleResize);

    // Cleanup function
    return () => {
      window.removeEventListener("resize", handleResize);
      if (container && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
      particleMaterial.dispose();
      particles.dispose();
    };
  }, [currentStep, isRecording]);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const sendMessage = async (text: string) => {
    const newMessages = [...messages, { text, sender: "user" as const }];
    setMessages(newMessages);
    if (currentStep === "welcome") {
      if (text === "Yes, I'm ready to begin") {
        setCurrentStep("record");
        setMessages((prev) => [
          ...prev,
          {
            text: "Great! Let's start by recording a short voice sample. This will be encrypted and stored securely. Only you will have access to it through an NFT we'll mint. Ready to record?",
            sender: "agent",
          },
        ]);
      } else {
        const response = await axios.post(
          `${import.meta.env.VITE_CHATBOT_API_URL}/voice-vault-chatbot`,
          {
            prompt: text,
          },
          {
            headers: {
              "Content-Type": "application/json",
            },
          }
        );
        console.log(response);
        setMessages((prev) => [
          ...prev,
          { text: response.data.explanation, sender: "agent" },
        ]);
        setQuickResponses(["Yes, I'm ready to begin"]);
      }
    } else if (currentStep === "record") {
      if (text === "Let's mint the NFT") {
        setCurrentStep("mint");
        setMessages((prev) => [
          ...prev,
          {
            text: "Perfect! I'll help you mint an NFT that will be your key to access your encrypted voice data. This ensures only you control your voice identity.",
            sender: "agent",
          },
        ]);
      }
    }
    // Simulate agent response
    // setTimeout(() => {
    // let response = "";
    // let options: string[] = [];

    // if (currentStep === "welcome") {
    //   response =
    //     "Great! Let's start by recording a short voice sample. This will be encrypted and stored securely. Only you will have access to it through an NFT we'll mint. Ready to record?";
    //   options = [
    //     "Yes, I'm ready to record",
    //     "Tell me more about this process",
    //     "How secure is this?",
    //   ];
    //   setCurrentStep("record");
    // } else if (currentStep === "record") {
    //   if (recordingComplete) {
    //     response =
    //       "Perfect! I'll help you mint an NFT that will be your key to access your encrypted voice data. This ensures only you control your voice identity.";
    //     options = [
    //       "Let's mint the NFT",
    //       "How does the NFT work?",
    //       "What's the benefit of this approach?",
    //     ];
    //     setCurrentStep("mint");
    //   } else {
    //     response =
    //       "⚠️ Recording required: I need a voice sample to proceed. Please complete the recording step by clicking the microphone button.";
    //     options = [
    //       "How long should I record?",
    //       "Is my data secure?",
    //       "Tell me more about this process",
    //     ];
    //     // Prevent proceeding to next steps without recording
    //     return;
    //   }
    // } else if (currentStep === "mint" && mintComplete) {
    //   response =
    //     "Excellent! Finally, would you like to provide your email to receive updates about our voice product?";
    //   options = [
    //     "Sure, I'll add my email",
    //     "I'd rather not share my email",
    //     "What kind of updates will I receive?",
    //   ];
    //   setCurrentStep("email");
    // } else if (currentStep === "email") {
    //   response =
    //     "Thank you for registering with VoiceVault! Your voice is now securely stored and accessible only by you. We'll be in touch with exciting updates soon.";
    //   options = [
    //     "Great! Thank you",
    //     "How can I access my voice data later?",
    //     "Tell me more about VoiceVault",
    //   ];
    //   setCurrentStep("complete");
    // } else {
    //   response = "I understand. What would you like to do next?";
    //   options = [
    //     "Start over",
    //     "How does this technology work?",
    //     "I have another question",
    //   ];
    // }

    // setMessages((prev) => [...prev, { text: response, sender: "agent" }]);
    // setQuickResponses(options);
    // }, 1000);
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      // Store start time
      const startTime = Date.now();
      const durationInterval = setInterval(() => {
        setRecordingDuration(Math.floor((Date.now() - startTime) / 1000));
      }, 100);

      // Set up audio analysis
      const audioContext = new AudioContext();
      audioContextRef.current = audioContext;
      const analyser = audioContext.createAnalyser();
      analyserRef.current = analyser;
      analyser.fftSize = 2048; // High resolution for detailed visualization
      analyser.smoothingTimeConstant = 0.85;

      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);

      // Set up the 3D visualization without direct Three.js references
      // (moved visualization update to the main Three.js useEffect)
      const updateVisualization = () => {
        if (!analyserRef.current) return;

        const bufferLength = analyserRef.current.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        analyserRef.current.getByteFrequencyData(dataArray);

        // Store audio data for the main visualizer to access
        if (document.getElementById("visualizer-container")) {
          // Store the audio data as a custom property on the container
          const container = document.getElementById("visualizer-container");
          if (container) {
            container.setAttribute("data-audio-active", "true");
            // Create a safe audio data representation with better frequency data
            const audioDataString = Array.from(dataArray.slice(0, 128)).join(
              ","
            );
            container.setAttribute("data-audio-data", audioDataString);

            // Trigger container update for better responsiveness
            container.style.setProperty(
              "--audio-level",
              (getAverageVolume(Array.from(dataArray)) / 255).toString()
            );
          }
        }

        // Helper function to calculate average volume
        function getAverageVolume(array: number[]) {
          const length = array.length;
          let values = 0;
          let i = 0;

          for (; i < length; i++) {
            values += array[i];
          }

          return values / length;
        }

        // Request next frame
        animationFrameRef.current = requestAnimationFrame(updateVisualization);
      };

      // Start visualization loop
      animationFrameRef.current = requestAnimationFrame(updateVisualization);

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        clearInterval(durationInterval);
        const duration = Math.floor((Date.now() - startTime) / 1000);
        setRecordingDuration(duration);

        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }

        // Clean up audio context
        if (
          audioContextRef.current &&
          audioContextRef.current.state !== "closed"
        ) {
          audioContextRef.current
            .close()
            .catch((err) => console.warn("Error closing audio context:", err));
        }

        // Clear visualizer data
        const container = document.getElementById("visualizer-container");
        if (container) {
          container.setAttribute("data-audio-active", "false");
          container.removeAttribute("data-audio-data");
        }

        // Validate minimum duration
        if (duration < 3) {
          setMessages((prev) => [
            ...prev,
            {
              text: "Your recording was too short. Please record for at least 3 seconds to proceed.",
              sender: "agent",
            },
          ]);
          return;
        }

        // Create audio URL from recorded chunks
        const audioBlob = new Blob(audioChunksRef.current, {
          type: "audio/webm",
        });
        const url = URL.createObjectURL(audioBlob);
        setAudioUrl(url);
        setRecordingComplete(true);
        sendMessage("I've completed my voice recording. What's next?");
        setQuickResponses([
          "Let's mint the NFT",
          "How does the NFT work?",
          "What's the benefit of this approach?",
        ]);
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error("Error accessing microphone:", error);
      setMessages((prev) => [
        ...prev,
        {
          text: "We couldn't access your microphone. Please check your browser permissions and try again.",
          sender: "agent",
        },
      ]);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream
        .getTracks()
        .forEach((track) => track.stop());
      setIsRecording(false);
    }
  };

  const mintNFT = async () => {
    setMinting(true);
    try {
      if (!isWalletConnected) {
        const address = await connectWallet();
        setWalletAddress(address);
        setIsWalletConnected(true);
        setMinting(false);
        return;
      }

      // Deploy contract if not already deployed
      if (!nftContractAddress) {
        // Get the recorded audio blob from audioChunksRef
        const audioBlob = new Blob(audioChunksRef.current, {
          type: "audio/webm",
        });

        const messageToSign = `Sign in to VoiceVault, this proves you own this wallet address`;
        const signature = await signMessageWithWalletAddress(messageToSign);
        const formData = new FormData();
        formData.append("file", audioBlob); // Send the actual audio blob instead of empty blob
        formData.append("signature", signature);
        formData.append("address", walletAddress);
        formData.append("message", messageToSign);

        // const response = await axios.post(
        //   `${import.meta.env.VITE_TEE_SERVER}/upload-encrypted-audio`,
        //   formData
        // );
        const cid =
          "response.data.cidQmeDNA51DYmpuzi24fcDKjMYUpVMxbNadaDTFaNq3QRzRy";
        const contract = await deployAIVoiceNFT(
          walletAddress,
          cid,
          "VoiceVault NFT",
          "VVOICE",
          ""
        );
        window.open(
          `https://aeneid.storyscan.xyz/tx/${contract.hash.toString()}`,
          "_blank"
        );
        setNftContractAddress(contract.hash.toString());
        console.log("Contract deployed at:", contract.target);
      }

      // Simulate IPFS upload of voice data
      // const mockIPFSHash = `ipfs://QmX${Math.random()
      //   .toString(36)
      //   .substring(2, 15)}`;

      // Mint NFT
      // await mintNFTToken(nftContractAddress, walletAddress, mockIPFSHash);

      setMinting(false);
      setMintComplete(true);
      sendMessage("I've successfully minted my NFT key.");
      setCurrentStep("email");
    } catch (error: any) {
      console.error("Error minting NFT:", error);
      setDeploymentError(error.message);
      setMinting(false);
    }
  };

  const handleSubmitEmail = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      sendMessage(`My email is ${email}`);
      setEmail("");
    }
  };

  // Add these new functions
  const handlePlayback = () => {
    if (audioElementRef.current) {
      if (isPlaying) {
        audioElementRef.current.pause();
        audioElementRef.current.currentTime = 0;
      } else {
        audioElementRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleReRecord = () => {
    setRecordingComplete(false);
    setAudioUrl(null);
    setIsPlaying(false);
    if (audioElementRef.current) {
      audioElementRef.current.pause();
      audioElementRef.current.currentTime = 0;
    }
  };

  return (
    <main className="app-container">
      <div className="header">
        <h1 data-text="VoiceVault">VoiceVault</h1>
        <p className="tagline">Secure your voice in the synthetic age</p>
      </div>

      <div className="content-container">
        <div className="left-panel">
          <div className="visualizer-container" id="visualizer-container"></div>
          {!showDecryption ? (
            <div className="step-indicator">
              <div
                className={`step ${currentStep === "welcome" ? "active" : ""} ${
                  currentStep !== "welcome" ? "completed" : ""
                }`}
              >
                <div className="step-number">1</div>
                <span>Welcome</span>
              </div>
              <div
                className={`step ${currentStep === "record" ? "active" : ""} ${
                  ["mint", "email", "complete"].includes(currentStep)
                    ? "completed"
                    : ""
                }`}
              >
                <div className="step-number">2</div>
                <span>
                  Record{" "}
                  {currentStep === "record" && !recordingComplete && (
                    <span className="step-required">● REQUIRED</span>
                  )}
                </span>
              </div>
              <div
                className={`step ${currentStep === "mint" ? "active" : ""} ${
                  ["email", "complete"].includes(currentStep) ? "completed" : ""
                }`}
              >
                <div className="step-number">3</div>
                <span>Mint NFT</span>
              </div>
              <div
                className={`step ${currentStep === "email" ? "active" : ""} ${
                  currentStep === "complete" ? "completed" : ""
                }`}
              >
                <div className="step-number">4</div>
                <span>Subscribe</span>
              </div>
              <div
                className={`step ${currentStep === "complete" ? "active" : ""}`}
              >
                <div className="step-number">5</div>
                <span>Complete</span>
              </div>
              {!walletAddress && currentStep !== "mint" && (
                <button
                  className="connect-wallet-button"
                  onClick={async () => {
                    const address = await connectWallet();
                    setWalletAddress(address);
                    setIsWalletConnected(true);
                  }}
                >
                  Connect Wallet
                </button>
              )}
            </div>
          ) : (
            <Decryption
              walletAddress={walletAddress}
              vaultAddress={vaultAddress}
              goBack={() => setShowDecryption(false)}
            />
          )}

          <div className="interaction-panel">
            {currentStep === "record" && (
              <div className="record-container">
                {!recordingComplete ? (
                  <>
                    <div
                      className={`microphone ${isRecording ? "recording" : ""}`}
                      onClick={isRecording ? stopRecording : startRecording}
                    >
                      {isRecording ? (
                        <FaMicrophoneSlash className="mic-icon-active" />
                      ) : (
                        <FaMicrophone />
                      )}
                      {isRecording && <div className="recording-waves"></div>}
                      {isRecording && (
                        <div className="recording-waves delay"></div>
                      )}
                    </div>
                    <p className="recording-status">
                      {isRecording
                        ? `Recording... ${recordingDuration}s (min 3s required) - Click to stop`
                        : "Click to start recording (min 3s required)"}
                    </p>
                  </>
                ) : (
                  <div className="playback-controls">
                    <audio
                      ref={audioElementRef}
                      src={audioUrl || ""}
                      onEnded={() => setIsPlaying(false)}
                    />
                    <button
                      className="playback-button"
                      onClick={handlePlayback}
                    >
                      {isPlaying ? "⏹️ Stop" : "▶️ Play Recording"}
                    </button>
                    <button
                      className="rerecord-button"
                      onClick={handleReRecord}
                    >
                      🔄 Record Again
                    </button>
                    <p className="proceed-text">
                      Listen to your recording and proceed when ready
                    </p>
                  </div>
                )}
              </div>
            )}

            {currentStep === "mint" && (
              <div className="mint-container">
                {!isWalletConnected ? (
                  <button
                    className="connect-wallet-button"
                    onClick={async () => {
                      const address = await connectWallet();
                      setWalletAddress(address);
                      setIsWalletConnected(true);
                    }}
                  >
                    Connect Wallet
                  </button>
                ) : (
                  <>
                    <button
                      className={`mint-button ${minting ? "minting" : ""} ${
                        mintComplete ? "complete" : ""
                      }`}
                      onClick={mintNFT}
                      disabled={minting || mintComplete}
                    >
                      <FaEthereum className="mint-icon" />
                      {minting
                        ? "Minting..."
                        : mintComplete
                        ? "NFT Minted"
                        : "Mint NFT"}
                      {mintComplete && <FaCheckCircle className="check-icon" />}
                    </button>

                    {mintComplete && (
                      <div className="secure-info">
                        <BsShieldLockFill className="secure-icon" />
                        <p>Your voice sample is secure and encrypted</p>
                      </div>
                    )}
                  </>
                )}

                {deploymentError && (
                  <div className="error-message">{deploymentError}</div>
                )}

                {minting && (
                  <div className="minting-animation">
                    <div className="cube">
                      <div className="face front"></div>
                      <div className="face back"></div>
                      <div className="face right"></div>
                      <div className="face left"></div>
                      <div className="face top"></div>
                      <div className="face bottom"></div>
                    </div>
                  </div>
                )}

                {mintComplete && (
                  <div className="nft-info">
                    <MdSecurity className="nft-security-icon" />
                    <p>Your voice data is now encrypted and stored on IPFS.</p>
                    <p>
                      Your NFT key provides exclusive access to your voice
                      identity.
                    </p>
                    <div className="nft-badge">
                      <FaLock className="lock-icon" />
                      <span>SECURED BY BLOCKCHAIN</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {currentStep === "email" && (
              <form className="email-form" onSubmit={handleSubmitEmail}>
                <div className="email-input-container">
                  <FaEnvelope className="email-icon" />
                  <input
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <button type="submit" className="subscribe-button">
                  Subscribe to Updates
                </button>
              </form>
            )}

            {currentStep === "complete" && (
              <div className="completion-message">
                <div className="checkmark-circle">
                  <div className="checkmark"></div>
                </div>
                <h2>Registration Complete!</h2>
                <p>
                  Thank you for securing your voice identity with VoiceVault.
                </p>
                <p>Your voice data is encrypted and accessible only by you.</p>
              </div>
            )}
          </div>
        </div>

        <ChatBot
          messages={messages}
          setMessages={setMessages}
          currentStep={currentStep}
          recordingComplete={recordingComplete}
          mintComplete={mintComplete}
          onStepChange={setCurrentStep}
          quickResponses={quickResponses}
          setQuickResponses={setQuickResponses}
          sendMessage={sendMessage}
        />
      </div>

      <footer>
        <p>VoiceVault © 2025 | Powered by Blockchain Technology</p>
      </footer>
      {/* <button
        onClick={() =>
          deployAIVoiceNFT(walletAddress, "cid", "name", "symbol", "baseUri")
        }
      >
        Sign Message
      </button> */}
    </main>
  );
}

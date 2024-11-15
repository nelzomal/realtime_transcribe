import Progress from "@/components/ui/Progress";
import { useState, useCallback, useEffect } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { PanelContext } from "./contexts/PanelContext";
import "../style.css";

const IS_WEBGPU_AVAILABLE = "gpu" in window.navigator && !!window.navigator.gpu;

// React component for injected content
const App = () => {
  const { setIsOpen } = useContext(PanelContext);
  const dragHandleRef = useRef<HTMLDivElement>(null);
  const [recordingStatus, setRecordingStatus] = useState<
    "loading" | "recording" | "stopped"
  >("stopped");
  const [selectedLanguage, setSelectedLanguage] = useState("english");
  const [isWhisperModelReady, setIsWhisperModelReady] = useState(false);
  const [isCheckingModels, setIsCheckingModels] = useState<boolean | string>(
    true
  );
  const [transcripts, setTranscripts] = useState<string[]>([]);
  const [progressItems, setProgressItems] = useState<
    Array<Background.ModelFileProgressItem>
  >([]);

  const sendMessageToBackground = useCallback(
    (message: MainPage.MessageToBackground) => {
      browser.runtime.sendMessage({ ...message, source: "inject" });
    },
    []
  );

  // check if the model files have been downloaded
  useEffect(() => {
    sendMessageToBackground({ action: "checkModelsLoaded" });
  }, [sendMessageToBackground]);

  useEffect(() => {
    const handleResponse = (messageFromBg: Background.MessageToInject) => {
      // Handle responses from the background script

      if (messageFromBg.status === "beginRecording") {
        // start recording
        setRecordingStatus("recording");
      } else if (messageFromBg.status === "completeChunk") {
        setTranscripts((prev) => [...prev, messageFromBg.data.chunks[0]]);
      } else if (messageFromBg.status === "modelsLoaded") {
        // model files loaded
        setIsCheckingModels(false);
        setIsWhisperModelReady(messageFromBg.result);
        // Load the model files
      } else if (messageFromBg.status === "initiate") {
        setProgressItems((prev) => [...prev, messageFromBg]);
      } else if (messageFromBg.status === "progress") {
        setProgressItems((prev) =>
          prev.map((item) => {
            if (item.file === messageFromBg.file) {
              return {
                ...item,
                progress: messageFromBg.progress,
                file: messageFromBg.file,
              };
            }
            return item;
          })
        );
      } else if (messageFromBg.status === "done") {
        setProgressItems((prev) =>
          prev.filter((item) => item.file !== messageFromBg.file)
        );
      } else if (messageFromBg.status === "loading") {
        setIsCheckingModels(messageFromBg.msg);
      } else if (messageFromBg.status === "ready") {
        setIsWhisperModelReady(true);
      }
    };
    browser.runtime.onMessage.addListener(handleResponse);

    return () => {
      browser.runtime.onMessage.removeListener(handleResponse);
    };
  }, []);

  const recordTabAudio = useCallback(() => {
    sendMessageToBackground({ action: "captureBackground" });
    setRecordingStatus("loading");
  }, [sendMessageToBackground]);

  // TODO check and improve stop recording logic
  const stopRecording = useCallback(() => {
    sendMessageToBackground({ action: "stopCaptureBackground" });
    setRecordingStatus("stopped");
  }, []);

  useEffect(
    () => () => {
      if (recordingStatus === "recording") {
        stopRecording();
      }
    },
    [stopRecording, recordingStatus]
  );

  const recordUI = useCallback(() => {
    return (
      <div className="flex flex-col items-center justify-between mb-4">
        Model files loaded
        {recordingStatus === "loading" ? (
          "Loading"
        ) : recordingStatus === "recording" ? (
          <button
            className="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 my-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center mr-2 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800 inline-flex items-center"
            onClick={() => stopRecording()}
          >
            Stop Record
          </button>
        ) : (
          <button
            className="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 my-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center mr-2 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800 inline-flex items-center"
            onClick={() => recordTabAudio()}
          >
            Record
          </button>
        )}
      </div>
    );
  }, [recordingStatus]);

  const notSupportedUI = () => {
    return (
      <div className="fixed w-screen h-screen bg-black z-10 bg-opacity-[92%] text-white text-2xl font-semibold flex justify-center items-center text-center">
        WebGPU is not supported
        <br />
        by this browser :&#40;
      </div>
    );
  };

  const renderHeader = () => {
    return (
      <div
        ref={dragHandleRef}
        className="flex items-center justify-between border-b bg-black p-4 text-white cursor-move select-none"
      >
        <div className="flex items-center gap-2">
          <div className="h-6 w-6 rounded bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500"></div>
          <h1 className="text-lg font-medium">Transcript & Summary</h1>
        </div>
      </div>
    );
  };

  return (
    <div className="h-full w-full bg-black">
      <div className="flex h-full flex-col">
        {renderHeader()}
        <div className="flex-1 overflow-auto bg-black p-4 text-white">
          {IS_WEBGPU_AVAILABLE ? (
            <div className="min-w-64 min-h-32 p-4 bg-white">
              <div className="flex flex-col items-center justify-between mb-4 ">
                <div className="w-full mb-4">
                  <LanguageSelector
                    value={selectedLanguage}
                    onChange={setSelectedLanguage}
                  />
                </div>
                {isWhisperModelReady ? (
                  recordUI()
                ) : (
                  <div className="w-full text-center">
                    {isCheckingModels ? (
                      isCheckingModels !== true ? (
                        isCheckingModels
                      ) : (
                        <div className="animate-pulse text-gray-600">
                          Checking model status...
                        </div>
                      )
                    ) : (
                      <button
                        className="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center mr-2 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800 inline-flex items-center"
                        onClick={() =>
                          sendMessageToBackground({
                            action: "loadWhisperModel",
                          })
                        }
                      >
                        Load Models
                      </button>
                    )}
                  </div>
                )}

                {progressItems.length > 0 && (
                  <div className="relative z-10 p-4 w-full text-center">
                    <label>Loading model files... (only run once)</label>
                    {progressItems.map((data) => (
                      <div key={data.file}>
                        <Progress text={data.file} percentage={data.progress} />
                      </div>
                    ))}
                  </div>
                )}

                {transcripts.length > 0 && (
                  <div className="flex flex-col h-full">
                    <div className="flex-none p-4 border-b border-border">
                      <h2 className="text-lg font-semibold">Transcript</h2>
                    </div>
                    <ScrollArea className="flex-grow">
                      <div className="p-4 space-y-4">
                        {transcripts.map((entry, index) => (
                          <div key={index} className="space-y-1">
                            <div className="font-medium text-primary">
                              <p className="text-red-500">{entry}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>
                )}
              </div>
            </div>
          ) : (
            notSupportedUI()
          )}
        </div>
      </div>
    </div>
  );
};

export default App;

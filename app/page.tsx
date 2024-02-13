"use client";
import { useEffect, useState } from "react";
import { Agents, advisorList, TranscriptSummary } from "../lib/llm";
import { transcript as simulation } from "../lib/simulate2";
import { FaPlay, FaPause, FaCog, FaMicrophone, FaRobot } from "react-icons/fa";

const agents = new Agents(process.env.NEXT_PUBLIC_OPENAI_API_KEY || "");

interface Transcript {
  text: string;
  analysis: TranscriptSummary | null;
}

export default function Home() {
  const [transcripts, setTranscripts] = useState<Transcript[]>([]);
  const [TTSRunning, setTTSRunning] = useState(false);
  const [simulationRunning, setSimulationRunning] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState("");
  const [advisor, setAdvisor] = useState(advisorList[0]);

  const addTranscript = async (text: string) => {
    const newTranscript: Transcript = {
      text,
      analysis: null,
    };
    setTranscripts((prev) => [...prev, newTranscript]);

    agents
      .reviewLatest(advisor, [
        ...transcripts.map((transcript) => transcript.text),
        text,
      ])
      .then((analysis) => {
        setTranscripts((prev) => {
          return prev.map((transcript) => {
            if (transcript.text === newTranscript.text) {
              return { ...transcript, analysis };
            }
            return transcript;
          });
        });
      });
  };

  useEffect(() => {
    const startSimulation = async () => {
      for (const text of simulation) {
        for (const word of text.split(/[^\w]+/)) {
          if (!simulationRunning) {
            break;
          }
          setInterimTranscript((prev) => prev + " " + word);
          await new Promise((resolve) => setTimeout(resolve, word.length * 50));
        }
        if (!simulationRunning) {
          break;
        }
        setInterimTranscript("");
        addTranscript(text);
      }
      setSimulationRunning(false);
    };

    if (simulationRunning) {
      startSimulation();
    }
  }, [simulationRunning]);

  useEffect(() => {
    let recognition: SpeechRecognition | undefined;

    const startTTS = () => {
      if ("SpeechRecognition" in window) {
        recognition = new window.SpeechRecognition();
      } else if ("webkitSpeechRecognition" in window) {
        recognition = new window.webkitSpeechRecognition();
      } else {
        console.log("SpeechRecognition is not supported in this browser");
        return;
      }
      recognition.lang = "en-US";
      recognition.interimResults = true;
      recognition.continuous = true;

      // @ts-ignore
      recognition.onresult = async (event: SpeechRecognitionEvent) => {
        const result = event.results[event.results.length - 1];
        const text = result[0].transcript;

        if (result.isFinal) {
          console.log("final transcript", text);
          console.log("transcripts", transcripts);

          setInterimTranscript("");
          addTranscript(text);
        } else {
          console.log("interim transcript", text);
          setInterimTranscript(text);
        }
      };

      recognition.start();
    };

    if (TTSRunning) {
      startTTS();
    }

    return () => {
      if (recognition) {
        recognition.stop();
      }
    };
  }, [TTSRunning, transcripts]);

  return (
    <>
      <main className="flex-grow flex items-center justify-center p-1 overflow-y-auto bg-black">
        <div>
          <div className="flex-row-reverse">
            {transcripts.map((transcript, index) => (
              <div
                key={index}
                className={
                  "flex m-1 rounded-lg text-gray-900 " +
                  (transcript.analysis
                    ? transcript.analysis?.speaker == 1
                      ? "bg-blue-100"
                      : "bg-green-100"
                    : "bg-gray-100")
                }
              >
                <div className="italic text-lg p-2 w-1/3">
                  {transcript.text}
                </div>
                <div className="text-black text-xl bg-white leading-tight p-2 px-4 w-2/3">
                  {transcript.analysis ? (
                    <>
                      <div className="text-gray-600">
                        {transcript.analysis.insight}
                      </div>
                      <div className="text-red-900 font-semibold">
                        {transcript.analysis.recommendation}
                      </div>
                    </>
                  ) : (
                    "..."
                  )}
                </div>
              </div>
            ))}
          </div>
          <div className="text-3xl text-gray-500">{interimTranscript}</div>
          {(TTSRunning || simulationRunning) ? (
            <div className="text-3xl text-gray-500">
              <FaMicrophone className="animate-pulse ease-in-out duration-75" />
            </div>
          ) : (
            <div className="text-5xl flex items-center text-gray-300">
              <span className="font-bold uppercase">Ready! Set!</span>{" "}
              <FaMicrophone className="ml-2 inline" />
            </div>
          )}
        </div>
      </main>
      <nav className="bg-white shadow-md p-2 flex justify-around">
        <button
          className={`flex items-center rounded-md px-3 py-1 ${
            !TTSRunning ? "" : "bg-red-400 animate-pulse ease-in-out	duration-75"
          }`}
          onClick={() => setTTSRunning(!TTSRunning)}
        >
          {TTSRunning ? (
            <FaPause className="mr-1" />
          ) : (
            <FaMicrophone className="mr-1" />
          )}
          <span>{TTSRunning ? "Pause" : "Listen"}</span>
        </button>
        <button
          className={`flex items-center rounded-md px-3 py-1 ${
            !simulationRunning
              ? ""
              : "bg-red-400 animate-pulse ease-in-out	duration-75"
          }`}
          onClick={() => setSimulationRunning(!simulationRunning)}
        >
          {simulationRunning ? (
            <FaPause className="mr-1" />
          ) : (
            <FaRobot className="mr-1" />
          )}
          <span>Simulate</span>
        </button>
        <div className="flex items-center">
          <FaCog className="mr-1" />
          <span>Advisor: </span>
          <select
            value={advisor}
            onChange={(e) => setAdvisor(e.target.value)}
            className="ml-1"
          >
            {advisorList.map((advisor) => (
              <option key={advisor} value={advisor}>
                {advisor}
              </option>
            ))}
          </select>
        </div>
      </nav>
    </>
  );
}

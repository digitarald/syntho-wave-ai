"use client";
import { useEffect, useState } from "react";
import { Agents, advisorList, TranscriptSummary } from "../../lib/llm";
import { transcript as simulation } from "../../lib/simulate2";
import { FaPlay, FaPause, FaCog, FaMicrophone, FaRobot } from "react-icons/fa";
import { useConfig } from "@/lib/configContext";

interface Transcript {
  text: string;
  analysis: TranscriptSummary | null;
}

export default function Home() {
  const { openaiApiKey, model } = useConfig();

  const [transcripts, setTranscripts] = useState<Transcript[]>([]);
  const [TTSRunning, setTTSRunning] = useState(false);
  const [simulationRunning, setSimulationRunning] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState("");
  const [advisor, setAdvisor] = useState(advisorList[0]);
  const [highlightedIndex, setHighlightedIndex] = useState<number | null>(null);

  const addTranscript = async (text: string) => {
    const newTranscript: Transcript = {
      text,
      analysis: null,
    };
    setTranscripts((prev) => [...prev, newTranscript]);

    // find latest analysis in transcripts
    const lastAnalysis = transcripts
      .toReversed()
      .find((transcript) => transcript.analysis)?.analysis;

    new Agents(openaiApiKey, model)
      .reviewLatest(
        advisor,
        [...transcripts.map((transcript) => transcript.text), text],
        lastAnalysis?.recommendation
      )
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
        console.error("SpeechRecognition is not supported in this browser");
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

  let lastSpeaker = 0;

  return (
    <>
      <main className="flex-grow flex flex-row items-stretch justify-stretch p-1 overflow-y-auto">
        <div className="justify-end leading-loose w-1/2 mx-4 my-6 shadow-md rounded-lg bg-white p-4">
          <div className="text-gray-500">
            {TTSRunning || simulationRunning ? (
              <FaMicrophone className="animate-pulse inline ease-in-out duration-75" />
            ) : (
              <span className="flex items-center text-gray-300">
                <span className="font-bold uppercase">Ready! Set!</span>{" "}
                <FaMicrophone className="ml-2 inline" />
              </span>
            )}
            {interimTranscript}
          </div>
          {transcripts.toReversed().map((transcript, index) => {
            const speakerChanged = transcript.analysis?.speaker !== lastSpeaker;
            lastSpeaker = transcript.analysis?.speaker || 0;
            return (
              <span
                key={`text-${index}`}
                className={`mr-2 transition-colors ${
                  speakerChanged ? "block " : "inline-block "
                } ${
                  transcript.analysis
                    ? transcript.analysis?.speaker == 1
                      ? "text-blue-900 "
                      : "text-green-900 "
                    : "text-gray-700 "
                } ${index === 0 ? "font-semibold " : ""} ${
                  highlightedIndex === index ? "bg-yellow-200 " : ""
                }`}
                onMouseEnter={() => setHighlightedIndex(index)}
                onMouseLeave={() => setHighlightedIndex(null)}
              >
                {transcript.text}
              </span>
            );
          })}
        </div>
        <div className="px-4 py-8 w-1/2">
          {transcripts.toReversed().map((transcript, index) => {
            if (!transcript.analysis?.recommendation) {
              return;
            }
            return (
              <div
                className={`text-lg px-2 py-1 first:bg-white first:text-xl transition-colors ${
                  highlightedIndex === index ? "bg-yellow-200" : ""
                }`}
                key={`analysis-${index}`}
                onMouseEnter={() => setHighlightedIndex(index)}
                onMouseLeave={() => setHighlightedIndex(null)}
              >
                {transcript.analysis?.recommendation}
              </div>
            );
          })}
        </div>
      </main>
      <nav className="bg-white border-t-2 p-2 flex justify-around">
        <button
          className={`flex items-center rounded-md px-3 py-1 ${
            !TTSRunning
              ? ""
              : "bg-red-400 animate-pulse ease-in-out duration-75"
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

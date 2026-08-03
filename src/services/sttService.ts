export interface STTEvent {
  text: string;
  isFinal: boolean;
  confidence: number;
  provider: string;
}

export type STTCallback = (event: STTEvent) => void;

export interface SpeechToTextProvider {
  startListening(onResult: STTCallback, onError: (error: any) => void): Promise<void>;
  stopListening(): void;
  getProviderName(): string;
}

export class WebSpeechSTTProvider implements SpeechToTextProvider {
  private recognition: any = null;
  private isListening = false;
  private onResultCallback: STTCallback | null = null;
  private onErrorCallback: ((error: any) => void) | null = null;

  constructor() {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = true;
      this.recognition.interimResults = true;
      this.recognition.lang = 'de-DE';

      this.recognition.onresult = (event: any) => {
        let interimTranscript = '';
        let finalTranscript = '';
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }
        
        if (this.onResultCallback) {
          if (finalTranscript) {
             this.onResultCallback({
               text: finalTranscript,
               isFinal: true,
               confidence: event.results[event.results.length - 1][0].confidence || 0.9,
               provider: this.getProviderName()
             });
          }
          if (interimTranscript) {
             this.onResultCallback({
               text: interimTranscript,
               isFinal: false,
               confidence: 0.5,
               provider: this.getProviderName()
             });
          }
        }
      };

      this.recognition.onerror = (event: any) => {
        if (this.onErrorCallback) {
          this.onErrorCallback(event.error);
        }
      };
      
      this.recognition.onend = () => {
         this.isListening = false;
      };
    }
  }

  async startListening(onResult: STTCallback, onError: (error: any) => void): Promise<void> {
    if (!this.recognition) {
       throw new Error("Web Speech API not supported in this browser.");
    }
    this.onResultCallback = onResult;
    this.onErrorCallback = onError;
    if (!this.isListening) {
      try {
        this.recognition.start();
        this.isListening = true;
      } catch(e) {
        console.error(e);
      }
    }
  }

  stopListening(): void {
    if (this.recognition && this.isListening) {
      this.recognition.stop();
      this.isListening = false;
    }
  }

  getProviderName(): string {
    return "WebSpeech API (Local Fallback)";
  }
}

export class StreamingSTTAdapter {
  private providers: SpeechToTextProvider[] = [];
  private currentProviderIndex = 0;

  constructor() {
     // Registering local fallback as the primary for now as required by the fallback chain
     this.providers.push(new WebSpeechSTTProvider());
  }

  async start(onResult: STTCallback, onError: (error: any) => void): Promise<void> {
    this.currentProviderIndex = 0;
    this.tryCurrentProvider(onResult, onError);
  }

  private tryCurrentProvider(onResult: STTCallback, onError: (error: any) => void) {
    if (this.currentProviderIndex >= this.providers.length) {
       onError(new Error("All STT providers failed."));
       return;
    }
    const provider = this.providers[this.currentProviderIndex];
    provider.startListening(onResult, (err) => {
       console.warn(`Provider ${provider.getProviderName()} failed:`, err);
       this.currentProviderIndex++;
       this.tryCurrentProvider(onResult, onError);
    }).catch(err => {
       console.warn(`Provider ${provider.getProviderName()} throwed:`, err);
       this.currentProviderIndex++;
       this.tryCurrentProvider(onResult, onError);
    });
  }

  stop() {
    if (this.currentProviderIndex < this.providers.length) {
       this.providers[this.currentProviderIndex].stopListening();
    }
  }
}

export const sttAdapter = new StreamingSTTAdapter();

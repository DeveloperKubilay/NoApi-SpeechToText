const puppeteer = require('puppeteer');
const EventEmitter = require('events');

class SpeechToText extends EventEmitter {
  constructor(languageCode = 'tr',chromeargs,checkInterval = 700,debug = false) {
    super();
    this.browser = null;
    this.page = null;
    this.intervalId = null;
    this.lastText = "";
    
    if (languageCode === 'en') {
      this.options = {
        sourceLanguage: 'en',
        targetLanguage: 'tr',
        checkInterval: checkInterval,
        debug: debug,
        chromeargs: chromeargs
      };
    } else {
      this.options = {
        sourceLanguage: languageCode,
        targetLanguage: 'en',
        checkInterval: checkInterval,
        debug: debug,
        chromeargs: chromeargs
      };
    }
  }

  async start() {
    if (this.browser) {
      return; 
    }

    try {
      this.browser = await puppeteer.launch({ 
        args: [
          '--allow-file-access-from-files',
          '--enable-usermedia-screen-capturing',
          '--allow-http-screen-capture',
          '--auto-select-desktop-capture-source=entire-screen',
          '--use-fake-ui-for-media-stream', 
          '--mute-audio',
          ...this.options.chromeargs
        ],
        headless: this.options.debug ? false : true,
      });
      
      this.page = await this.browser.newPage();
      

      const translatorUrl = `https://www.bing.com/translator?to=${this.options.targetLanguage}&setlang=${this.options.sourceLanguage}`;
      await this.page.goto(translatorUrl, { waitUntil: 'networkidle2', timeout: 60000 });
      
      await this.page.evaluateOnNewDocument(() => {
        navigator.mediaDevices.getUserMedia = async () => {
          return Promise.resolve(true);
        };
      });
      
      if(this.options.debug) console.log("Waiting for speech recognition button to load...");
      await this.page.waitForSelector("div.ovr_cont > div", { timeout: 30000 });
      try{
        await this.page.click("div.ovr_cont > div");
      }catch{
        await this.page.evaluate(() => {
            const micButton = document.querySelector("div.ovr_cont > div");
            if (micButton) micButton.click();
            }
        );
      }
      if(this.options.debug) console.log("Speech recognition started");
      
      this.intervalId = setInterval(async () => {
        try {
          const text = await this.page.evaluate(() => {
            if (!document.querySelector("div.ovr_cont > div > div")) {
              return document.querySelector("#tta_input_ta").innerHTML;
            }
          });
          
          if (text) {
            this.lastText = text;
            await this.page.evaluate(() => {
              setTimeout(() => {
                const playIcon = document.querySelector("#tta_playicontgt");
                if (playIcon) playIcon.click();
                setTimeout(() => {
                  const micButton = document.querySelector("div.ovr_cont > div");
                  if (micButton) micButton.click();
                }, 100);
              }, 300);
            });
            this.emit("speech", text);
          }
        } catch (error) {
          console.error("Error in speech recognition interval:", error);
        }
      }, this.options.checkInterval);
    } catch (error) {
      await this.stop();
      throw error;
    }
  }

  async stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      this.page = null;
    }
    
    if(this.options.debug) console.log("Speech recognition stopped");
  }
}

module.exports = SpeechToText;
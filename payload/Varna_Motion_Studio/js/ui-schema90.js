/* Order, location and accessible names of the task groups.
   Selectors reference the original controls; their native state and actions remain authoritative. */
(function (w) {
  'use strict';
  const group=(id,fa,en,...targets)=>({id,fa,en,targets});
  w.VarnaUISchema90={
    audio:[
      group('source','منبع','Source','#transcriptionSource','#timelineTextScope'),
      group('engine','مدل و زبان','Model & language','#language','#modelSelect'),
      group('result','پردازش','Processing','#btnTranscribe','#transcribeStatus')
    ],
    text:[
      group('list','کپشن‌ها','Captions','#captionSearch','#captionList'),
      group('edit','متن فعال','Edit text','#reviewText'),
      group('timing','زمان‌بندی','Timing','#startTime','#endTime'),
      group('appearance','ظاهر','Appearance','#fontSelect','#fontSize'),
      group('layout','چیدمان','Layout','#layoutLines','#justifyWidth')
    ],
    motion:[
      group('preview','پیش‌نمایش','Preview','#motionCaption','#motionPreviewQuality'),
      group('presets','حرکت','Motion','#motionTargetPhase','#animIntroPreset'),
      group('timing','زمان و ریتم','Timing','#animSpeedPreset','#animIn'),
      group('typing','تایپ','Typing','#typingEnabled','#typingPreset'),
      group('custom','حرکت سفارشی','Custom motion','#naBased','#motionBuilderName')
    ],
    kinetic:[
      group('layout','چیدمان عبارت','Phrase layout','#scenePattern40','#sceneLines40'),
      group('pieces','کلمه‌ها','Words','#scenePieces40'),
      group('preview','پیش‌نمایش','Preview','#sceneStage40'),
      group('wordmotion','موشن کلمه','Word motion','#wordPresets39')
    ],
    table:[
      group('preview','قاب و تبدیل','Canvas & transform','#tableViewport89'),
      group('structure','ساختار','Structure','#tableRows','#tableCols'),
      group('cells','خانه‌ها','Cells','#tableEditor','#cellAlignment48'),
      group('appearance','ظاهر','Appearance','#tableFill','#tableFont'),
      group('timing','زمان حرکت','Timing','#tableStartRange','#tableMotion')
    ],
    bg:[
      group('material','متریال','Material','.bg-style-browser'),
      group('appearance','ظاهر','Appearance','#bgColor','#bgOpacity'),
      group('optics','شیشه و نور','Glass & light','#aeGlassControls','#bgRoughness'),
      group('motion','حرکت','Motion','#bgReflowCanvas67','#bgMotionDur')
    ],
    safe:[
      group('platform','قاب و پلتفرم','Frame & platform','#safePresetSelect','#safeMiniPreview'),
      group('geometry','ابعاد و حاشیه','Size & margins','#safeWidth','#safeMarginLeft'),
      group('overlay','نمایش','Overlay','#safeOverlayColor','#safeOverlayOpacity'),
      group('social','رابط اجتماعی','Social guides','#safeSocialPlatform')
    ],
    keywords:[
      group('scope','فعال‌سازی','Enable','#keywordsEnabled44'),
      group('words','انتخاب کلمه','Words','#highlightWords37'),
      group('appearance','رنگ و ظاهر','Appearance','#highlightColor37','#highlightPreview37'),
      group('suggest','پیشنهادها','Suggestions','#suggestHighlight37','#suggestAllHighlight37')
    ],
    templates:[
      group('library','کتابخانه','Library','#nativeCollection50','#templateSearch38'),
      group('selection','انتخاب استایل','Styles','#nativeGrid50','#templateGrid38'),
      group('scope','اعمال روی','Apply to','#nativeScope50','#templateScope40'),
      group('parameters','پارامترها','Parameters','#templateSlots38','#templateBuild45')
    ],
    easing49:[
      group('curve','منحنی','Curve','#curveEditor49'),
      group('presets','پریست','Presets','#curvePresets49'),
      group('size','ابعاد شیپ','Shape size','#shapeWidth50')
    ],
    ai:[
      group('request','درخواست','Request','#aiPreset','#aiPrompt'),
      group('review','بررسی','Review','#pendingList','#aiOriginal'),
      group('memory','حافظه','Memory','#correctionMemoryMode','#memoryWrong'),
      group('chat','گفتگو','Chat','#chatInput')
    ],
    translate:[
      group('language','زبان مقصد','Language','#translateTarget'),
      group('review','متن و ترجمه','Review','#translateOriginal','#translateSuggestion'),
      group('approval','تأیید','Approve','#btnTranslateApproveAll','#btnTranslateApproveOne')
    ],
    sfx:[
      group('source','کامپوزیشن','Composition','#btnUseActiveCompSfx'),
      group('library','کتابخانه','Library','#sfxLibraryPath'),
      group('selection','انتخاب صدا','Sound selection','#sfxDensityLevel','#sfxUseCuts'),
      group('review','پیشنهادها','Review','#sfxSuggestionList','#btnAnalyzeSfx'),
      group('mix','میکس','Mix','#audioMixProfile','#audioTargetLUFS')
    ],
    music:[
      group('source','منبع و موتور','Source & engine','#brainMusicSource','#brainMusicEngineStart'),
      group('cue','بازه و صدا','Cue','#cueKind50','#cueStart50'),
      group('style','استایل و حس','Style','#cueStyle50','#brainMusicMood'),
      group('queue','صف تولید','Queue','#audioCues50','#cueGenerate50')
    ],
    brand:[
      group('library','انتخاب برند','Brand library','#brandList','#brandScope'),
      group('identity','هویت','Identity','#brandName','#brandText'),
      group('assets','دارایی‌ها','Assets','#brandAddLogo','#brandAddAssets')
    ],
    director:[
      group('brief','شرح پروژه','Brief','#brainBrief','#brainProfile'),
      group('plan','پیشنهاد و زمان','Plan','#brainTimeline','#brainPlan'),
      group('apply','بازبینی و اعمال','Review & apply','#brainApply','#brainDiscard')
    ],
    assistant49:[
      group('model','مدل','Model','#assistantProvider49','#assistantModel49'),
      group('prompt','درخواست','Prompt','#assistantPrompt49'),
      group('code','کد پیشنهادی','Code','#assistantCode49','#assistantStatus49')
    ],
    tools:[
      group('library','ابزارها','Tools','.flow-tool-library77'),
      group('controls','کنترل ابزار','Tool controls','#smartToolControls','#embeddedToolHost'),
      group('layers','لایه‌ها','Layers','#glassaryObjectsRefresh')
    ],
    resources:[
      group('performance','عملکرد','Performance','#resourceProfile','#resourceThreads'),
      group('models','موتورها و مدل‌ها','Engines & models','#localRoot','#localRuntimeDir'),
      group('diagnostics','بررسی اتصال','Diagnostics','#btnCheckLocalRoles')
    ],
    settings:[
      group('theme','ظاهر رابط','Appearance','#appearance50','#themePreset50'),
      group('host','ارتباط با افتر','Host','#btnReconnectHost','#btnHostDiagnostics'),
      group('profiles','پروفایل','Profiles','#settingsProfileName','#btnSaveSettingsProfile')
    ],
    output:[
      group('target','مقصد','Destination','#outputTarget36','#outputMode'),
      group('check','بررسی','Checks','#btnCheckOutput','#outputPerformance41'),
      group('subtitle','فایل زیرنویس','Subtitle file','#btnExportSrt','#btnImportSrt')
    ]
  };
})(window);

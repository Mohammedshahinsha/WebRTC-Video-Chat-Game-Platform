const fs = require('fs');
const path = require('path');

/**
 * ChatForYou 경로 변환 엔진
 * 웹 환경 -> Electron 환경 경로 자동 변환
 */
class PathConverter {
  constructor(options = {}) {
    this.options = {
      verbose: options.verbose || false,
      dryRun: options.dryRun || false,
      ...options
    };

    this.logger = options.logger || console;
    
    // 변환 통계
    this.stats = {
      filesProcessed: 0,
      filesModified: 0,
      pathsConverted: 0,
      errors: 0
    };

    // 변환 규칙 정의
    this.conversionRules = {
      // HTML 파일 변환 규칙
      HTML: [
        {
          name: 'base-href-electron',
          description: 'base href="/chatforyou/" -> base href="../"',
          pattern: /<base\s+href=["']\/chatforyou\/["']\s*\/?>/gi,
          replacement: '<base href="../">'
        },
        {
          name: 'base-href-current-removal',
          description: 'base href="./" -> base href="../"',
          pattern: /<base\s+href=["']\.\/">/gi,
          replacement: '<base href="../">'
        },
        {
          name: 'static-href-conversion',
          description: 'href="static/" -> href="static/"',
          pattern: /href=["']static\//g,
          replacement: 'href="static/'
        },
        {
          name: 'static-src-conversion',
          description: 'src="static/" -> src="static/"',
          pattern: /src=["']static\//g,
          replacement: 'src="static/'
        },
        {
          name: 'absolute-static-conversion',
          description: 'href="/static/" -> href="static/"',
          pattern: /href=["']\/static\//g,
          replacement: 'href="static/'
        },
        {
          name: 'absolute-static-src-conversion',
          description: 'src="/static/" -> src="static/"',
          pattern: /src=["']\/static\//g,
          replacement: 'src="static/'
        },
        {
          name: 'script-js-conversion',
          description: 'script src="js/" -> src="static/js/"',
          pattern: /src=["']js\//g,
          replacement: 'src="static/js/'
        },
        {
          name: 'script-config-conversion',
          description: 'script src="config/" -> src="config/"',
          pattern: /src=["']config\//g,
          replacement: 'src="config/'
        },
        {
          name: 'relative-static-fix',
          description: 'href="./static/" -> href="static/"',
          pattern: /href=["']\.\//g,
          replacement: 'href="'
        },
        {
          name: 'relative-src-fix',
          description: 'src="./static/" -> src="static/"',
          pattern: /src=["']\.\//g,
          replacement: 'src="'
        },
        {
          name: 'images-path-conversion',
          description: 'src="images/" -> src="static/images/"',
          pattern: /src=["']images\//g,
          replacement: 'src="static/images/'
        },
        {
          name: 'images-href-conversion',
          description: 'href="images/" -> href="static/images/"',
          pattern: /href=["']images\//g,
          replacement: 'href="static/images/'
        },
        {
          name: 'css-rtc-conversion',
          description: 'href="css/rtc/" -> href="static/css/rtc/"',
          pattern: /href=["']css\/rtc\//g,
          replacement: 'href="static/css/rtc/'
        },
        {
          name: 'css-common-conversion',
          description: 'href="css/common/" -> href="static/css/common/"',
          pattern: /href=["']css\/common\//g,
          replacement: 'href="static/css/common/'
        },
        {
          name: 'css-directory-conversion',
          description: 'href="css/" -> href="static/css/"',
          pattern: /href=["']css\//g,
          replacement: 'href="static/css/'
        },
        {
          name: 'generic-static-directory-conversion',
          description: 'href="styles/" -> href="static/styles/"',
          pattern: /href=["'](styles|fonts|libs|assets)\//g,
          replacement: 'href="static/$1/'
        },
        {
          name: 'generic-static-src-conversion',
          description: 'src="styles/" -> src="static/styles/"',
          pattern: /src=["'](styles|fonts|libs|assets)\//g,
          replacement: 'src="static/$1/'
        },
        {
          name: 'config-script-fix',
          description: 'Fix config.js script tag quotation error',
          pattern: /src=["']config\/config\.js['"]><\/script>/g,
          replacement: 'src="config/config.js"></script>'
        }
      ],

      // CSS 파일 변환 규칙
      CSS: [
        {
          name: 'url-static-conversion',
          description: 'url("/static/") -> url("../static/")',
          pattern: /url\(["']?\/static\//g,
          replacement: 'url("../static/'
        },
        {
          name: 'url-relative-conversion',
          description: 'url("static/") -> url("../static/")',
          pattern: /url\(["']?static\//g,
          replacement: 'url("../static/'
        },
        {
          name: 'import-static-conversion',
          description: '@import "/static/" -> @import "../static/"',
          pattern: /@import\s+["']\/static\//g,
          replacement: '@import "../static/'
        }
      ],

      // JavaScript 파일 변환 규칙
      JS: [
        {
          name: 'fetch-static-conversion',
          description: 'fetch("/static/") -> fetch("./static/")',
          pattern: /fetch\(["']\/static\//g,
          replacement: 'fetch("./static/'
        },
        {
          name: 'xhr-static-conversion',
          description: 'XMLHttpRequest URL 변환',
          pattern: /["']\/static\//g,
          replacement: '"./static/'
        },
        {
          name: 'dynamic-script-loading-conversion',
          description: '`js/popup/` -> `static/js/popup/`',
          pattern: /[`'"]js\/popup\//g,
          replacement: '`static/js/popup/'
        },
        {
          name: 'loadScript-js-popup-conversion',
          description: 'loadScript(`js/popup/${popupName}_popup.js`) -> loadScript(`static/js/popup/${popupName}_popup.js`)',
          pattern: /loadScript\(\s*[`'"]js\/popup\/\$\{[^}]+\}_popup\.js[`'"]\s*\)/g,
          replacement: 'loadScript(`static/js/popup/${popupName}_popup.js`)'
        },
        {
          name: 'fetch-templates-conversion',
          description: 'fetch(`templates/`) -> fetch(`templates/`)',
          pattern: /fetch\(\s*["']templates\//g,
          replacement: 'fetch(`templates/'
        },
        {
          name: 'script-src-js-conversion',
          description: 'script.src = "js/" -> script.src = "static/js/"',
          pattern: /\.src\s*=\s*[`'"]js\//g,
          replacement: '.src = "static/js/'
        },
        {
          name: 'image-src-webrtc-conversion',
          description: '.src = "images/webrtc/" -> .src = "static/images/webrtc/"',
          pattern: /\.src\s*=\s*[`'"]images\/webrtc\//g,
          replacement: '.src = "static/images/webrtc/'
        },
        {
          name: 'image-attr-webrtc-conversion',
          description: 'attr("src", "/images/webrtc/") -> attr("src", "static/images/webrtc/")',
          pattern: /attr\(\s*[`'"](src|href)[`'"]\s*,\s*[`'"]\/images\/webrtc\//g,
          replacement: 'attr("$1", "static/images/webrtc/'
        },
        {
          name: 'image-direct-webrtc-conversion',
          description: '"/images/webrtc/" -> "static/images/webrtc/"',
          pattern: /[`'"]\/?images\/webrtc\//g,
          replacement: '"static/images/webrtc/'
        },
        {
          name: 'quote-fix-webrtc-conversion',
          description: 'Fix mismatched quotes in webrtc image paths',
          pattern: /"static\/images\/webrtc\/([^'"]+)\.svg'/g,
          replacement: '"static/images/webrtc/$1.svg"'
        }
      ]
    };
  }

  /**
   * 디렉토리 전체 변환
   */
  async convertDirectory(dirPath) {
    this.logger.info(`🔄 경로 변환 시작: ${dirPath}`);
    this.stats = { filesProcessed: 0, filesModified: 0, pathsConverted: 0, errors: 0 };

    try {
      await this.processDirectory(dirPath);
      this.printConversionSummary();
      return this.stats;
    } catch (error) {
      this.logger.error('❌ 경로 변환 실패:', error.message);
      throw error;
    }
  }

  /**
   * 재귀적으로 디렉토리 처리
   */
  async processDirectory(dirPath) {
    if (!fs.existsSync(dirPath)) {
      this.logger.warn(`⚠️ 디렉토리가 존재하지 않습니다: ${dirPath}`);
      return;
    }

    const entries = fs.readdirSync(dirPath, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);

      if (entry.isDirectory()) {
        // node_modules, .git 등은 제외
        if (!this.shouldSkipDirectory(entry.name)) {
          await this.processDirectory(fullPath);
        }
      } else {
        await this.processFile(fullPath);
      }
    }
  }

  /**
   * 개별 파일 처리
   */
  async processFile(filePath) {
    this.stats.filesProcessed++;

    try {
      const fileExt = path.extname(filePath).toLowerCase();
      const fileType = this.getFileType(fileExt);

      if (!fileType) {
        if (this.options.verbose) {
          this.logger.debug(`⏭️ 건너뜀: ${filePath} (지원하지 않는 파일 형식)`);
        }
        return;
      }

      const originalContent = fs.readFileSync(filePath, 'utf8');
      const convertedContent = await this.convertFileContent(originalContent, fileType, filePath);

      // 내용이 변경된 경우에만 파일 쓰기
      if (originalContent !== convertedContent) {
        if (!this.options.dryRun) {
          fs.writeFileSync(filePath, convertedContent, 'utf8');
        }
        
        this.stats.filesModified++;
        
        if (this.options.verbose) {
          this.logger.info(`✅ 변환 완료: ${filePath}`);
        }
      }

    } catch (error) {
      this.stats.errors++;
      this.logger.error(`❌ 파일 변환 실패: ${filePath}`, error.message);
    }
  }

  /**
   * 파일 내용 변환
   */
  async convertFileContent(content, fileType, filePath) {
    let convertedContent = content;
    const rules = this.conversionRules[fileType] || [];
    let filePathsConverted = 0;

    for (const rule of rules) {
      const matches = convertedContent.match(rule.pattern);
      if (matches) {
        const beforeConversion = convertedContent;
        convertedContent = convertedContent.replace(rule.pattern, rule.replacement);
        
        // 실제로 변환이 일어났는지 확인
        if (beforeConversion !== convertedContent) {
          filePathsConverted += matches.length;
          
          if (this.options.verbose) {
            this.logger.debug(`  🔧 ${rule.name}: ${matches.length}개 경로 변환`);
          }
        }
      }
    }

    this.stats.pathsConverted += filePathsConverted;

    // 파일별 변환 결과 로깅
    if (filePathsConverted > 0 && this.options.verbose) {
      this.logger.info(`  📝 ${path.basename(filePath)}: ${filePathsConverted}개 경로 변환됨`);
    }

    return convertedContent;
  }

  /**
   * 파일 확장자로 파일 타입 결정
   */
  getFileType(extension) {
    const typeMap = {
      '.html': 'HTML',
      '.htm': 'HTML',
      '.css': 'CSS',
      '.scss': 'CSS',
      '.sass': 'CSS',
      '.less': 'CSS',
      '.stylus': 'CSS',
      '.js': 'JS',
      '.jsx': 'JS',
      '.ts': 'JS',
      '.tsx': 'JS',
      '.vue': 'HTML',  // Vue 컴포넌트도 HTML과 유사하게 처리
      '.mjs': 'JS',
      '.cjs': 'JS'
    };

    return typeMap[extension] || null;
  }

  /**
   * 건너뛸 디렉토리 판단
   */
  shouldSkipDirectory(dirName) {
    const skipDirs = [
      'node_modules',
      '.git',
      '.vscode',
      '.idea',
      'dist',
      'build',
      '.backup',
      '.cache',
      'coverage'
    ];

    return skipDirs.includes(dirName) || dirName.startsWith('.');
  }

  /**
   * 단일 파일 변환 (외부 API)
   */
  async convertFile(filePath) {
    if (!fs.existsSync(filePath)) {
      throw new Error(`파일을 찾을 수 없습니다: ${filePath}`);
    }

    await this.processFile(filePath);
    return this.stats;
  }

  /**
   * 변환 규칙 추가
   */
  addConversionRule(fileType, rule) {
    if (!this.conversionRules[fileType]) {
      this.conversionRules[fileType] = [];
    }

    // 규칙 유효성 검사
    if (!rule.name || !rule.pattern || typeof rule.replacement === 'undefined') {
      throw new Error('변환 규칙에는 name, pattern, replacement가 필요합니다');
    }

    this.conversionRules[fileType].push(rule);
    this.logger.info(`✅ 변환 규칙 추가: ${fileType} - ${rule.name}`);
  }

  /**
   * 변환 미리보기 (dry run)
   */
  async previewConversion(filePath) {
    const originalDryRun = this.options.dryRun;
    const originalVerbose = this.options.verbose;
    
    this.options.dryRun = true;
    this.options.verbose = true;

    try {
      if (fs.statSync(filePath).isDirectory()) {
        await this.convertDirectory(filePath);
      } else {
        await this.convertFile(filePath);
      }
    } finally {
      this.options.dryRun = originalDryRun;
      this.options.verbose = originalVerbose;
    }

    return this.stats;
  }

  /**
   * 변환 통계 출력
   */
  printConversionSummary() {
    this.logger.info('\n📊 경로 변환 완료 요약:');
    this.logger.info(`📁 처리된 파일: ${this.stats.filesProcessed}개`);
    this.logger.info(`✏️  수정된 파일: ${this.stats.filesModified}개`);
    this.logger.info(`🔄 변환된 경로: ${this.stats.pathsConverted}개`);
    this.logger.info(`❌ 오류: ${this.stats.errors}개`);

    if (this.stats.errors === 0) {
      this.logger.info('🎉 경로 변환이 성공적으로 완료되었습니다!');
    }
  }

  /**
   * 변환 가능한 파일 목록 조회
   */
  getConvertibleFiles(dirPath) {
    const convertibleFiles = [];
    
    const walkDirectory = (currentPath) => {
      const entries = fs.readdirSync(currentPath, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(currentPath, entry.name);
        
        if (entry.isDirectory() && !this.shouldSkipDirectory(entry.name)) {
          walkDirectory(fullPath);
        } else if (entry.isFile()) {
          const fileExt = path.extname(entry.name).toLowerCase();
          if (this.getFileType(fileExt)) {
            convertibleFiles.push({
              path: fullPath,
              type: this.getFileType(fileExt),
              size: fs.statSync(fullPath).size
            });
          }
        }
      }
    };

    if (fs.existsSync(dirPath)) {
      walkDirectory(dirPath);
    }

    return convertibleFiles;
  }

  /**
   * 백업 생성
   */
  async createBackup(filePath, backupDir) {
    const fileName = path.basename(filePath);
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFileName = `${fileName}.backup-${timestamp}`;
    const backupPath = path.join(backupDir, backupFileName);

    // 백업 디렉토리 생성
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    // 파일 백업
    fs.copyFileSync(filePath, backupPath);
    
    this.logger.info(`💾 백업 생성: ${backupPath}`);
    return backupPath;
  }
}

module.exports = PathConverter;
const fs = require('fs');
const path = require('path');

/**
 * 고급 경로 변환 엔진
 * 확장 가능하고 동적인 웹→Electron 경로 변환 시스템
 */
class AdvancedPathConverter {
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

    // 파일 타입별 변환 전략
    this.conversionStrategies = new Map();
    this.initializeConversionStrategies();
    
    // 동적 패턴 규칙
    this.dynamicPatterns = new Map();
    this.initializeDynamicPatterns();
  }

  /**
   * 변환 전략 초기화
   */
  initializeConversionStrategies() {
    // HTML 파일 변환 전략
    this.conversionStrategies.set('html', {
      patterns: [
        {
          name: 'base-href-normalization',
          description: '모든 base href를 Electron 형식으로 변환',
          pattern: /<base\s+href=["'][^"']*["']/gi,
          replacement: '<base href="../">'
        },
        {
          name: 'static-resource-paths',
          description: 'static 리소스 경로 정규화',
          pattern: /(href|src)=["'](?:\.\/)?(?:\/)?static\//gi,
          replacement: '$1="static/'
        },
        {
          name: 'script-source-normalization',
          description: 'script src 경로 정규화',
          pattern: /src=["'](?:\.\/)?(?:\/)?(?:js|static\/js)\//gi,
          replacement: 'src="static/js/'
        },
        {
          name: 'config-path-normalization',
          description: 'config 경로 정규화',
          pattern: /src=["'](?:\.\/)?(?:\/)?config\//gi,
          replacement: 'src="config/'
        }
      ],
      postProcess: (content, filePath) => {
        // HTML 후처리 로직
        return this.normalizeHtmlPaths(content, filePath);
      }
    });

    // CSS/SCSS 파일 변환 전략
    this.conversionStrategies.set('css', {
      patterns: [
        {
          name: 'url-path-conversion',
          description: 'CSS url() 경로 변환',
          pattern: /url\(\s*["']?(?:\.\/)?(?:\/)?static\//gi,
          replacement: 'url("../static/'
        },
        {
          name: 'import-path-conversion',
          description: '@import 경로 변환',
          pattern: /@import\s+["'](?:\.\/)?(?:\/)?static\//gi,
          replacement: '@import "../static/'
        }
      ],
      postProcess: (content, filePath) => {
        return this.normalizeCssPaths(content, filePath);
      }
    });

    // JavaScript 파일 변환 전략
    this.conversionStrategies.set('js', {
      patterns: [
        {
          name: 'fetch-api-paths',
          description: 'fetch() API 경로 변환',
          pattern: /fetch\(\s*["'](?:\.\/)?(?:\/)?(?=(?:static|templates|config)\/)/gi,
          replacement: 'fetch("'
        },
        {
          name: 'dynamic-import-paths',
          description: '동적 import 경로 변환',
          pattern: /import\(\s*["'](?:\.\/)?(?:\/)?(?=(?:static|templates)\/)/gi,
          replacement: 'import("'
        },
        {
          name: 'script-loading-paths',
          description: '동적 스크립트 로딩 경로 변환',
          pattern: /(?:\.src\s*=|loadScript\(\s*[`'"])(?:\.\/)?(?:\/)?js\//gi,
          replacement: (match) => {
            if (match.includes('loadScript')) {
              return match.replace(/js\//, 'static/js/');
            }
            return match.replace(/js\//, 'static/js/');
          }
        }
      ],
      postProcess: (content, filePath) => {
        return this.normalizeJavaScriptPaths(content, filePath);
      }
    });
  }

  /**
   * 동적 패턴 초기화
   */
  initializeDynamicPatterns() {
    // 템플릿 리터럴 패턴
    this.dynamicPatterns.set('template-literal', {
      pattern: /`[^`]*\${[^}]*}[^`]*`/g,
      handler: (match, filePath) => {
        // 템플릿 리터럴 내부의 경로 정규화
        return match.replace(/(?:\$\{[^}]*\})?(?:\.\/)?(?:\/)?js\//g, 
          (subMatch) => subMatch.replace(/js\//, 'static/js/'));
      }
    });

    // 상대 경로 패턴
    this.dynamicPatterns.set('relative-paths', {
      pattern: /["']\.{1,2}\/[^"']*["']/g,
      handler: (match, filePath) => {
        // 상대 경로 정규화 (필요에 따라)
        return match;
      }
    });
  }

  /**
   * 디렉토리 전체 변환
   */
  async convertDirectory(dirPath) {
    this.logger.info(`🔄 고급 경로 변환 시작: ${dirPath}`);
    this.stats = { filesProcessed: 0, filesModified: 0, pathsConverted: 0, errors: 0 };

    try {
      await this.processDirectory(dirPath);
      this.printConversionSummary();
      return this.stats;
    } catch (error) {
      this.logger.error('❌ 고급 경로 변환 실패:', error.message);
      throw error;
    }
  }

  /**
   * 재귀적 디렉토리 처리
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
    let pathsConverted = 0;

    // 기본 패턴 적용
    const strategy = this.conversionStrategies.get(fileType);
    if (strategy) {
      for (const rule of strategy.patterns) {
        const beforeConversion = convertedContent;
        
        if (typeof rule.replacement === 'function') {
          convertedContent = convertedContent.replace(rule.pattern, rule.replacement);
        } else {
          convertedContent = convertedContent.replace(rule.pattern, rule.replacement);
        }
        
        if (beforeConversion !== convertedContent) {
          const matches = beforeConversion.match(rule.pattern) || [];
          pathsConverted += matches.length;
          
          if (this.options.verbose) {
            this.logger.debug(`  🔧 ${rule.name}: ${matches.length}개 경로 변환`);
          }
        }
      }

      // 후처리 적용
      if (strategy.postProcess) {
        const beforePostProcess = convertedContent;
        convertedContent = strategy.postProcess(convertedContent, filePath);
        
        if (beforePostProcess !== convertedContent && this.options.verbose) {
          this.logger.debug(`  🎯 후처리 적용됨`);
        }
      }
    }

    // 동적 패턴 적용
    for (const [patternName, patternConfig] of this.dynamicPatterns) {
      const beforeDynamic = convertedContent;
      const matches = convertedContent.match(patternConfig.pattern) || [];
      
      for (const match of matches) {
        const converted = patternConfig.handler(match, filePath);
        if (converted !== match) {
          convertedContent = convertedContent.replace(match, converted);
          pathsConverted++;
        }
      }
      
      if (beforeDynamic !== convertedContent && this.options.verbose) {
        this.logger.debug(`  🌟 동적 패턴 ${patternName}: ${matches.length}개 처리`);
      }
    }

    this.stats.pathsConverted += pathsConverted;

    if (pathsConverted > 0 && this.options.verbose) {
      this.logger.info(`  📝 ${path.basename(filePath)}: ${pathsConverted}개 경로 변환됨`);
    }

    return convertedContent;
  }

  /**
   * HTML 경로 정규화
   */
  normalizeHtmlPaths(content, filePath) {
    // 특수한 HTML 경로 처리 로직
    let normalized = content;
    
    // 이미지 경로 정규화
    normalized = normalized.replace(
      /(src|href)=["'](?:\.\/)?(?:\/)?images\//gi,
      '$1="static/images/'
    );
    
    // 폰트 경로 정규화  
    normalized = normalized.replace(
      /(src|href)=["'](?:\.\/)?(?:\/)?fonts\//gi,
      '$1="static/fonts/'
    );
    
    return normalized;
  }

  /**
   * CSS 경로 정규화
   */
  normalizeCssPaths(content, filePath) {
    let normalized = content;
    
    // 웹폰트 경로 정규화
    normalized = normalized.replace(
      /url\(\s*["']?(?:\.\/)?(?:\/)?fonts\//gi,
      'url("../static/fonts/'
    );
    
    // 이미지 경로 정규화
    normalized = normalized.replace(
      /url\(\s*["']?(?:\.\/)?(?:\/)?images\//gi,
      'url("../static/images/'
    );
    
    return normalized;
  }

  /**
   * JavaScript 경로 정규화
   */
  normalizeJavaScriptPaths(content, filePath) {
    let normalized = content;
    
    // 템플릿 리터럴의 복잡한 경로 패턴 처리
    normalized = normalized.replace(
      /`(?:[^`]*\$\{[^}]*\}[^`]*)*(?:\.\/)?(?:\/)?(?:js|static\/js)\/[^`]*`/g,
      (match) => {
        return match.replace(/(?:\.\/)?(?:\/)?js\//g, 'static/js/');
      }
    );
    
    return normalized;
  }

  /**
   * 파일 타입 결정
   */
  getFileType(extension) {
    const typeMap = new Map([
      ['.html', 'html'],
      ['.htm', 'html'],
      ['.css', 'css'],
      ['.scss', 'css'],
      ['.sass', 'css'],
      ['.js', 'js'],
      ['.jsx', 'js'],
      ['.ts', 'js'],
      ['.tsx', 'js'],
      ['.mjs', 'js'],
      ['.cjs', 'js']
    ]);

    return typeMap.get(extension) || null;
  }

  /**
   * 건너뛸 디렉토리 판단
   */
  shouldSkipDirectory(dirName) {
    const skipDirs = new Set([
      'node_modules', '.git', '.vscode', '.idea', 
      'dist', 'build', '.backup', '.cache', 'coverage',
      '.next', '.nuxt', '.output'
    ]);

    return skipDirs.has(dirName) || dirName.startsWith('.');
  }

  /**
   * 동적 변환 규칙 추가
   */
  addConversionRule(fileType, rule) {
    const strategy = this.conversionStrategies.get(fileType);
    if (!strategy) {
      this.conversionStrategies.set(fileType, { patterns: [], postProcess: null });
    }
    
    this.conversionStrategies.get(fileType).patterns.push(rule);
    this.logger.info(`✅ 동적 변환 규칙 추가: ${fileType} - ${rule.name}`);
  }

  /**
   * 동적 패턴 추가
   */
  addDynamicPattern(name, pattern, handler) {
    this.dynamicPatterns.set(name, { pattern, handler });
    this.logger.info(`✅ 동적 패턴 추가: ${name}`);
  }

  /**
   * 변환 통계 출력
   */
  printConversionSummary() {
    this.logger.info('\n📊 고급 경로 변환 완료 요약:');
    this.logger.info(`📁 처리된 파일: ${this.stats.filesProcessed}개`);
    this.logger.info(`✏️  수정된 파일: ${this.stats.filesModified}개`);
    this.logger.info(`🔄 변환된 경로: ${this.stats.pathsConverted}개`);
    this.logger.info(`❌ 오류: ${this.stats.errors}개`);

    if (this.stats.errors === 0) {
      this.logger.info('🎉 고급 경로 변환이 성공적으로 완료되었습니다!');
    }
  }
}

module.exports = AdvancedPathConverter;
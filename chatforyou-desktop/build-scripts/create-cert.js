#!/usr/bin/env node

const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

class CertificateCreator {
  constructor() {
    this.logPrefix = '[CERT-CREATE]';
    this.certName = 'ChatForYou CERT';
    this.teamId = '2508031628';
  }

  log(message) {
    console.log(`${this.logPrefix} ${message}`);
  }

  error(message) {
    console.error(`${this.logPrefix} ERROR: ${message}`);
  }

  // 기존 인증서 확인
  async checkExistingCert() {
    return new Promise((resolve) => {
      exec(`security find-identity -v -p codesigning | grep "${this.certName}"`, (error, stdout) => {
        if (error) {
          resolve(false);
        } else {
          resolve(stdout.trim().length > 0);
        }
      });
    });
  }

  // Self-signed 인증서 생성
  async createSelfSignedCert() {
    return new Promise((resolve, reject) => {
      const command = `
        security create-keypair \\
          -a RSA \\
          -s 2048 \\
          -f CSSM_ALGID_RSA \\
          -t permanent \\
          -d "Developer ID Application: ${this.certName} (${this.teamId})" \\
          -k ~/Library/Keychains/login.keychain-db \\
          "${this.certName}"
      `.replace(/\s+/g, ' ').trim();

      this.log('Self-signed 인증서 생성 중...');
      
      exec(command, (error, stdout, stderr) => {
        if (error) {
          this.error(`인증서 생성 실패: ${error.message}`);
          reject(error);
        } else {
          this.log('✅ Self-signed 인증서 생성 완료');
          resolve(stdout);
        }
      });
    });
  }

  // 인증서를 신뢰할 수 있는 것으로 설정
  async trustCertificate() {
    return new Promise((resolve, reject) => {
      const command = `security set-key-partition-list -S apple-tool:,apple: -s -k "" ~/Library/Keychains/login.keychain-db`;
      
      exec(command, (error, stdout, stderr) => {
        if (error) {
          this.log(`⚠️  인증서 신뢰 설정 실패 (수동 설정 필요): ${error.message}`);
          resolve(false); // 에러이지만 계속 진행
        } else {
          this.log('✅ 인증서 신뢰 설정 완료');
          resolve(true);
        }
      });
    });
  }

  // electron-builder 설정 업데이트 제안
  showConfigUpdate() {
    this.log('\n📝 electron-builder 설정 업데이트가 필요합니다:');
    console.log(`
{
  "mac": {
    "identity": "Developer ID Application: ${this.certName} (${this.teamId})",
    "hardenedRuntime": true,
    "gatekeeperAssess": false
  }
}
    `);
  }

  // 사용자 안내
  showUserInstructions() {
    this.log('\n📋 사용자 안내사항:');
    console.log(`
1. 첫 번째 설치 시 사용자가 실행해야 할 명령어:
   xattr -dr com.apple.quarantine /Applications/YourApp.app

2. 이후 자동업데이트는 완전 자동으로 작동합니다.

3. 만약 "키체인 접근"에서 인증서가 신뢰되지 않은 상태라면:
   - "키체인 접근" 앱 열기
   - "${this.certName}" 인증서 찾기
   - 더블클릭 → "신뢰" → "코드 서명: 항상 신뢰"로 변경
    `);
  }

  // 메인 실행 함수
  async run() {
    try {
      this.log('🚀 Self-signed 인증서 생성 시작...');

      // macOS 확인
      if (process.platform !== 'darwin') {
        throw new Error('이 스크립트는 macOS에서만 실행할 수 있습니다.');
      }

      // 기존 인증서 확인
      const exists = await this.checkExistingCert();
      if (exists) {
        this.log('⚠️  동일한 이름의 인증서가 이미 존재합니다.');
        this.log('기존 인증서를 사용하거나 수동으로 삭제 후 다시 실행하세요.');
        return;
      }

      // 인증서 생성
      await this.createSelfSignedCert();

      // 신뢰 설정 (실패해도 계속 진행)
      await this.trustCertificate();

      // 설정 안내
      this.showConfigUpdate();
      this.showUserInstructions();

      this.log('\n🎉 Self-signed 인증서 설정 완료!');
      
    } catch (error) {
      this.error(`실행 실패: ${error.message}`);
      process.exit(1);
    }
  }
}

// 스크립트 실행
if (require.main === module) {
  const creator = new CertificateCreator();
  creator.run();
}

module.exports = CertificateCreator;
const { project } = require('xcode');
const fs = require('fs');

const projectPath = 'ios/EllingtonPersonalBanking.xcodeproj/project.pbxproj';
const myProj = project(projectPath);

myProj.parseSync();
myProj.addResourceFile('GoogleService-Info.plist', { target: myProj.getFirstTarget().uuid });
fs.writeFileSync(projectPath, myProj.writeSync());
console.log('Added GoogleService-Info.plist to Xcode project');

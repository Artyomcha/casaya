require 'json'

package = JSON.parse(File.read(File.join(__dir__, '..', 'package.json')))

Pod::Spec.new do |s|
  s.name           = 'CasayaMaps3d'
  s.version        = package['version']
  s.summary        = package['description']
  s.license        = 'MIT'
  s.author         = 'Casaya'
  s.homepage       = 'https://casaya.es'
  s.platforms      = { :ios => '16.0' }
  s.source         = { git: 'https://casaya.es' }
  s.static_framework = true

  s.dependency 'ExpoModulesCore'

  # Maps 3D SDK раздаётся только Swift Package Manager'ом, а Expo-модули
  # собираются CocoaPods. Поэтому xcframework кладётся рядом скриптом
  # scripts/fetch-ios-sdk.mjs: prepare_command для локальных подов (:path)
  # CocoaPods не выполняет.

  s.vendored_frameworks = 'Frameworks/GoogleMaps3D.xcframework'
  s.libraries = 'sqlite3', 'c++'

  s.pod_target_xcconfig = {
    'DEFINES_MODULE' => 'YES',
    'SWIFT_COMPILATION_MODE' => 'wholemodule',
  }

  s.source_files = "**/*.{h,m,mm,swift,hpp,cpp}"
end

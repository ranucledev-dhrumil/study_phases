!include "StrFunc.nsh"
${StrRep}

!macro NSIS_HOOK_POSTINSTALL
  ; Best-effort Native Messaging Registry writes
  ; Using WriteRegStr sets the registry key without failing if the browser isn't present
  WriteRegStr HKCU "Software\Google\Chrome\NativeMessagingHosts\com.secondbrain.host" "" "$INSTDIR\com.secondbrain.host.json"
  WriteRegStr HKCU "Software\Microsoft\Edge\NativeMessagingHosts\com.secondbrain.host" "" "$INSTDIR\com.secondbrain.host.json"

  ; Create the manifest JSON dynamically so it accurately points to the final $INSTDIR
  FileOpen $0 "$INSTDIR\com.secondbrain.host.json" w
  FileWrite $0 "{$\r$\n"
  FileWrite $0 '  "name": "com.secondbrain.host",$\r$\n'
  FileWrite $0 '  "description": "Second Brain Browser Extension integration",$\r$\n'
  ; Escape backslashes in the path for JSON
  StrCpy $1 "$INSTDIR\second-brain-host.exe"
  ${StrRep} $1 $1 "\" "\\"
  FileWrite $0 '  "path": "$1",$\r$\n'
  FileWrite $0 '  "type": "stdio",$\r$\n'
  FileWrite $0 '  "allowed_origins": [$\r$\n'
  FileWrite $0 '    "chrome-extension://nlkpiaianojgfobdnafcfhcjidihoomo/"$\r$\n'
  FileWrite $0 "  ]$\r$\n"
  FileWrite $0 "}$\r$\n"
  FileClose $0
!macroend

!macro NSIS_HOOK_POSTUNINSTALL
  ; Best-effort cleanup of Native Messaging Registry writes
  DeleteRegKey HKCU "Software\Google\Chrome\NativeMessagingHosts\com.secondbrain.host"
  DeleteRegKey HKCU "Software\Microsoft\Edge\NativeMessagingHosts\com.secondbrain.host"
!macroend

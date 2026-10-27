import {getAuth} from 'firebase/auth';
import {doc,getDocFromServer,onSnapshot,runTransaction,serverTimestamp,Timestamp} from 'firebase/firestore';
import {database} from './firebase';
import {uid} from '../types/teaching';
export const REMOTE_COMMANDS=[['focus-presentation','返回簡報'],['open-browser','開啟 Chrome'],['open-approved-url','開啟 YouTube'],['open-ebook','開啟電子課本'],['focus-browser','切換至 Chrome'],['focus-ebook','切換至電子課本'],['next-window','下一個視窗'],['media-toggle','播放／暫停'],['volume-up','音量＋'],['volume-down','音量－'],['mute-toggle','靜音／取消靜音']] as const;
export type RemoteCommand=typeof REMOTE_COMMANDS[number][0];
export type RemoteDevice={ownerUid:string;controllerUid:string;requestUid:string;confirmation:string;state:'waiting'|'paired'|'revoked';enabled:boolean;createdAt:Timestamp;updatedAt:Timestamp;allowAfter:Timestamp;heartbeat:Timestamp};
export type RemoteResult={commandId:string;action:string;state:'pending'|'accepted'|'completed'|'failed'|'expired';message:string;issuedAt:Timestamp;updatedAt:Timestamp;expiresAt:Timestamp};
export function remoteCode(input:string){const code=input.trim().toLowerCase();if(!/^[a-f0-9]{64}$/.test(code))throw new Error('請貼上接收程式顯示的完整配對碼（64字元）。');return code;}
export async function claimRemote(input:string){
 const raw=remoteCode(input);const hash=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(raw));const code=Array.from(new Uint8Array(hash),byte=>byte.toString(16).padStart(2,'0')).join('');const db=await database(),user=getAuth().currentUser;if(!user)throw new Error('請重新連線。');
 // A high-entropy capability selects the pairing record; Windows must approve this UID locally.
 const ref=doc(db,'remoteDevices',code);const confirmation=String(crypto.getRandomValues(new Uint32Array(1))[0]%100000000).padStart(8,'0');
 await runTransaction(db,async tx=>{const snapshot=await tx.get(ref);if(!snapshot.exists())throw new Error('配對碼不存在或已失效。');const data=snapshot.data() as RemoteDevice;if(data.ownerUid===user.uid)throw new Error('請在另一部裝置配對。');if(data.state!=='waiting'||data.requestUid)throw new Error('此配對碼已使用，請在電腦產生新配對碼。');tx.update(ref,{requestUid:user.uid,confirmation,updatedAt:serverTimestamp()});});
 return {code,confirmation};
}
export async function watchRemote(code:string,receive:(device:RemoteDevice|null)=>void,fail:()=>void){const db=await database();return onSnapshot(doc(db,'remoteDevices',remoteCode(code)),snapshot=>{if(snapshot.metadata.fromCache){fail();return;}receive(snapshot.exists()?snapshot.data() as RemoteDevice:null);},()=>fail());}
export async function watchRemoteResult(code:string,receive:(result:RemoteResult|null)=>void,fail:()=>void){const db=await database();return onSnapshot(doc(db,'remoteDevices',remoteCode(code),'commands','current'),snapshot=>{if(!snapshot.metadata.fromCache)receive(snapshot.exists()?snapshot.data() as RemoteResult:null);},()=>fail());}
export async function disconnectRemote(code:string){const db=await database();await runTransaction(db,async tx=>{const ref=doc(db,'remoteDevices',remoteCode(code));const snapshot=await tx.get(ref);if(!snapshot.exists())return;tx.update(ref,{state:'revoked',enabled:false,updatedAt:serverTimestamp()});});}
export async function sendRemote(code:string,action:RemoteCommand){
 if(!navigator.onLine)throw new Error('網絡已中斷，不會排程遙控指令。');
 if(!REMOTE_COMMANDS.some(([value])=>value===action))throw new Error('不支援的指令。');
 const db=await database(),user=getAuth().currentUser;if(!user)throw new Error('請重新連線。');
 const device=(await getDocFromServer(doc(db,'remoteDevices',remoteCode(code)))).data() as RemoteDevice|undefined;
 if(!device||device.state!=='paired'||!device.enabled||device.controllerUid!==user.uid||!device.heartbeat||Date.now()-device.heartbeat.toMillis()>12000)throw new Error('Windows 尚未允許控制或已離線。');
 const project=import.meta.env.VITE_FIREBASE_PROJECT_ID,base=`projects/${project}/databases/(default)`;
 const commandId=uid();const token=await user.getIdToken();
 // REST commit is intentionally not an offline SDK write and has no automatic retry.
 const fields={commandId:{stringValue:commandId},action:{stringValue:action},controllerUid:{stringValue:user.uid},state:{stringValue:'pending'},message:{stringValue:''},expiresAt:{timestampValue:new Date(Date.now()+10000).toISOString()}};
 let response:Response;
 try{response=await fetch(`https://firestore.googleapis.com/v1/${base}/documents:commit`,{method:'POST',signal:AbortSignal.timeout(8000),headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'},body:JSON.stringify({writes:[{update:{name:`${base}/documents/remoteDevices/${code}/commands/current`,fields},updateTransforms:[{fieldPath:'issuedAt',setToServerValue:'REQUEST_TIME'},{fieldPath:'updatedAt',setToServerValue:'REQUEST_TIME'}]}]})});}catch{throw new Error('未能確認指令是否送達；不會自動重試，請先查看電腦。');}
 if(!response.ok)throw new Error('指令未獲允許：請檢查電腦連線、上一項指令及裝置時間。');
 return commandId;
}

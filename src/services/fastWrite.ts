import { getAuth } from 'firebase/auth';
import { database } from './firebase';
function field(value:unknown):Record<string,unknown>{
 if(typeof value==='boolean')return {booleanValue:value};
 if(typeof value==='number')return Number.isInteger(value)?{integerValue:String(value)}:{doubleValue:value};
 if(typeof value==='string')return {stringValue:value};
 throw new Error('Unsupported realtime field');
}
// A direct commit has no preliminary read and never queues an offline action.
export async function fastWrite(path:string,values:Record<string,unknown>,partial=false){
 if(!navigator.onLine)throw new Error('網絡已中斷，請重新連線。');
 await database();
 const user=getAuth().currentUser;
 if(!user)throw new Error('請重新連線。');
 const token=await user.getIdToken();
 const project=import.meta.env.VITE_FIREBASE_PROJECT_ID;
 const base=`projects/${project}/databases/(default)`;
 const write={update:{name:`${base}/documents/${path}`,fields:Object.fromEntries(Object.entries(values).map(([key,value])=>[key,field(value)]))},
  updateTransforms:[{fieldPath:'updatedAt',setToServerValue:'REQUEST_TIME'}],
  ...(partial?{updateMask:{fieldPaths:Object.keys(values)},currentDocument:{exists:true}}:{})};
 const response=await fetch(`https://firestore.googleapis.com/v1/${base}/documents:commit`,{signal:AbortSignal.timeout(10000),method:'POST',headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'},body:JSON.stringify({writes:[write]})});
 if(!response.ok)throw new Error('同步失敗，請檢查連線並重試。');
 const result=await response.json() as {commitTime?:string};
 return result.commitTime?Date.parse(result.commitTime):0;
}

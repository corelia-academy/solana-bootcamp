import { BN } from "@coral-xyz/anchor";
import { PublicKey, SystemProgram, SYSVAR_CLOCK_PUBKEY, type Connection } from "@solana/web3.js";
import type { Poll, VotingClient } from "./domain";

const bytes=(value:string)=>new TextEncoder().encode(value);
const u64le=(value:string)=>Uint8Array.from(new BN(value).toArray("le",8));
const u16le=(value:number)=>Uint8Array.from(new BN(value).toArray("le",2));

// `program` là Anchor Program sinh từ IDL Module 6; dùng dynamic type để file build được trước khi IDL được copy vào frontend.
export function createAnchorVotingClient(program:any,connection:Connection):VotingClient{
 return{
  async listPolls():Promise<Poll[]>{
   const [pollRows,candidateRows]=await Promise.all([program.account.poll.all(),program.account.candidate.all()]);
   return pollRows.map((row:any)=>{const pollKey=row.publicKey as PublicKey;const candidates=candidateRows.filter((item:any)=>item.account.poll.equals(pollKey)).map((item:any)=>({id:item.account.candidateId,name:item.account.name,votes:Number(item.account.votes.toString())}));return{id:row.account.pollId.toString(),title:row.account.title,startsAt:Number(row.account.startTime.toString()),endsAt:Number(row.account.endTime.toString()),candidates}});
  },
  async vote({pollId,candidateId,voter}){
   const voterKey=new PublicKey(voter);
   const [poll]=PublicKey.findProgramAddressSync([bytes("poll"),u64le(pollId)],program.programId);
   const [candidate]=PublicKey.findProgramAddressSync([bytes("candidate"),poll.toBytes(),u16le(candidateId)],program.programId);
   const [voteReceipt]=PublicKey.findProgramAddressSync([bytes("vote"),poll.toBytes(),voterKey.toBytes()],program.programId);
   return program.methods.vote(new BN(pollId),candidateId).accounts({poll,candidate,voteReceipt,voter:voterKey,clock:SYSVAR_CLOCK_PUBKEY,systemProgram:SystemProgram.programId}).rpc();
  },
  async confirm(signature){await connection.confirmTransaction(signature,"confirmed");}
 };
}

import { Address, balance, Context, Contract, generateEvent, Storage, transferCoins } from '@massalabs/massa-as-sdk';
import { Args } from '@massalabs/as-types';

export const OWNER_KEY = 'OWNER';
export const FEE_PERCENTAGE_KEY = 'FEE_PERCENTAGE';

export function constructor(_: StaticArray<u8>): void {
  assert(Context.isDeployingContract());
  const owner = Context.caller().toString();
  Storage.set(OWNER_KEY, owner);
  const feePercentage = "0.1" // 0.1%
  Storage.set(FEE_PERCENTAGE_KEY, feePercentage);
}

export function donate(binaryArgs: StaticArray<u8>): void {
  assert(Storage.has(FEE_PERCENTAGE_KEY), 'Fee percentage is not set');
  const feesPercentage = parseFloat(Storage.get(FEE_PERCENTAGE_KEY))/100;
  const recipient = new Args(binaryArgs)
    .nextString()
    .expect("Recipient address is missing");
  const amountTransferred = Context.transferredCoins();
  const amountToRecipient = f64(amountTransferred)/(f64(1)+feesPercentage);
  transferCoins(new Address(recipient), u64(amountToRecipient));
  generateEvent("Donate " + u64(amountToRecipient).toString() + " to " + recipient + " (Amount transferred: " + amountTransferred.toString() + ")");
}

export function withdraw(_: StaticArray<u8>): void {
  assert(Storage.has(OWNER_KEY), 'Owner address is not set');
  const owner = Storage.get(OWNER_KEY);
  transferCoins(new Address(owner), balance());
}

export function updateOwner(binaryArgs: StaticArray<u8>): void {
  _isOwner();
  const owner = new Args(binaryArgs)
    .nextString()
    .expect("Address is missing");
  Storage.set(OWNER_KEY, owner);
}

export function updateFee(binaryArgs: StaticArray<u8>): void {
  _isOwner();
  const feePercentage = new Args(binaryArgs)
    .nextF64()
    .expect("Fee percentage is missing");
  Storage.set(FEE_PERCENTAGE_KEY, feePercentage.toString());
}

function _isOwner(): void {
  const owner = Storage.get(OWNER_KEY);
  const caller = Context.caller().toString();
  assert(caller == owner, "Caller is not the owner");
}
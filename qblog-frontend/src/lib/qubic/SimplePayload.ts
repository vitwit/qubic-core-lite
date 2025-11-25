import { IQubicBuildPackage } from '@qubic-lib/qubic-ts-library/dist/qubic-types/IQubicBuildPackage';

export class SimplePayload implements IQubicBuildPackage {
    private data: Uint8Array;

    constructor(data: Uint8Array) {
        this.data = data;
    }

    getPackageSize(): number {
        return this.data.length;
    }

    getPackageData(): Uint8Array {
        return this.data;
    }
}

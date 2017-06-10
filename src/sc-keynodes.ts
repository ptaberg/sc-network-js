import * as Q from 'q';

import { ScAddr } from './sc-types';
import { SctpClient } from './sc-network';

export class ScKeynodes {
    private client: SctpClient = null;
    private cache: {[id: string] : ScAddr; } = {};

    constructor(client: SctpClient) {
        this.client = client;
    }

    /* Resolve specified keynodes by their system identifiers
     * Params:
     * - keynodes - array of system identifiers to resolve sc-elements
     * Return:
     * - returns dictionary, where keys - system identifier; values - sc-addrs of specified sc-elements
     */
    public ResolveKeynodes(keynodes: string[]) {
         
        const self = this;
        function resolveKeynodeImpl(idtf: string) {
            const dfd = Q.defer<any>();
            const value = self.cache[idtf];
            if (value) {
                dfd.resolve([idtf, value]);
            } else {
                self.client.FindElementBySysIdtf(idtf).then(function(addr) {
                    if (addr) {
                        self.cache[idtf] = addr;
                    }
                    dfd.resolve([idtf, addr]);
                });
            }
            return dfd.promise;
        }

        const dfd_global = Q.defer<any>();
        const promises = [];
        for (let i = 0; i < keynodes.length; ++i)
            promises.push(resolveKeynodeImpl(keynodes[i]));

        Q.all(promises).then(function(results) {
            const resolved: {[id: string] : ScAddr} = {};
            for (let i = 0; i < results.length; ++i) {
                resolved[results[i][0]] = results[i][1];
            }
            dfd_global.resolve(resolved);
        });

        return dfd_global.promise;
    }
};

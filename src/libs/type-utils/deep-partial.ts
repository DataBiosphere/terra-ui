// From https://pendletonjones.com/deep-partial
export type DeepPartial<T> = unknown extends T
    ? T
    : T extends object
        ? {
          [P in keyof T]?: T[P] extends Array<infer U>
              ? Array<DeepPartial<U>>
              : T[P] extends ReadonlyArray<infer U>
                  ? ReadonlyArray<DeepPartial<U>>
                  : DeepPartial<T[P]>;
        }
        : T;

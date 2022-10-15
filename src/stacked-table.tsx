import { ReactElement } from "react";
import { clsx } from "clsx";

// type ValueOf<
//   ObjectType,
//   ValueType extends keyof ObjectType = keyof ObjectType
// > = ObjectType[ValueType];

type TableFieldMap<Entity> = {
  [K in keyof Entity]: TableField<Entity, K>;
};

type Breakpoint = "sm" | "md" | "lg";

type TableField<Entity, K extends keyof Entity> = {
  label: string;
  collapse?: {
    collapseOn?: keyof Entity; // If not defined then it just collapses completely
    breakpoint: Breakpoint;
  };
  renderField?: (options: {
    value: Entity[K];
    config: TableFieldMap<Entity>[keyof Entity];
    row: Entity;
  }) => ReactElement | null;
  /**
   * weight overrides the default order and applies sorting to the field names
   */
  weight?: number;
};

export function StackedTable<Entity extends { id: number | string }>({
  data,
  dataFields,
  extraFields,
}: {
  data: Entity[];
  /** Field configuration control how the data is displayed */
  dataFields: Partial<TableFieldMap<Entity>>;
  /**
   * Extra Fields configure any extra columns you might want, that do not map to data directly
   * Rendered last, unless weight is applied
   * */
  extraFields?: Partial<Record<string, TableField<Entity, any>>>;
}) {
  const combinedFields = { ...dataFields, ...extraFields };
  const fieldList = Object.entries(combinedFields).map(
    ([key, fieldConfig]: [string, TableField<Entity, any>]) => ({
      key,
      config: fieldConfig,
    })
  );
  // TODO: Add weight sorting to fieldList
  return (
    <div className="-mx-4 mt-8 overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:-mx-6 md:mx-0 md:rounded-lg">
      <table className="min-w-full divide-y divide-gray-300">
        <thead className="bg-gray-50">
          <tr>
            {fieldList.map((fc) => (
              <th
                key={fc.key}
                scope="col"
                className={clsx(
                  "py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6",
                  breakPointColumn(fc.config)
                )}
              >
                {fc.config.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 bg-white">
          {data.map((row) => {
            return (
              <tr key={`${row.id}`}>
                {fieldList.map((fc) => {
                  const fieldValue = row[fc.key as keyof typeof row];
                  return (
                    <td
                      key={fc.key}
                      className={clsx(
                        "px-6 py-4 text-left text-sm text-gray-500",
                        breakPointColumn(fc.config)
                      )}
                    >
                      <>
                        {fc.config.renderField
                          ? fc.config.renderField({
                              value: fieldValue,
                              config: fc.config,
                              row,
                            })
                          : defaultFieldRenderer(fieldValue)}
                        <dl className="font-normal">
                          {fieldList // Collapsed fields here
                            .filter((cfc) => {
                              if (!row[cfc.key as keyof typeof row]) {
                                return false;
                              }
                              if (cfc.config.collapse?.collapseOn !== fc.key) {
                                return false;
                              }
                              return true;
                            })
                            .map((cfc) => (
                              <>
                                <dt className="sr-only">{cfc.config.label}</dt>
                                <dd
                                  className={clsx(
                                    "mt-1 truncate text-gray-700",
                                    cfc.config.collapse &&
                                      `${String(
                                        cfc.config.collapse.breakpoint
                                      )}:hidden`
                                  )}
                                >
                                  {cfc.config.renderField
                                    ? cfc.config.renderField({
                                        value: fieldValue,
                                        config: cfc.config,
                                        row,
                                      })
                                    : defaultFieldRenderer(
                                        row[cfc.key as keyof typeof row]
                                      )}
                                </dd>
                              </>
                            ))}
                        </dl>
                      </>
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function defaultFieldRenderer(value: unknown) {
  const type = typeof value;
  switch (type) {
    case "string":
    case "number":
    case "bigint":
      return <>{value}</>;
    case "undefined":
      console.error(`[StackedTable] Received extra field, but no renderer`);
      return "[missing renderer]";
    default:
      console.error(`[StackedTable] Missing renderer for type '${type}'`);
      return "[missing renderer]";
  }
}

function breakPointColumn<Entity>(c: TableField<Entity, any>) {
  return c.collapse && `hidden ${c.collapse.breakpoint}:table-cell`;
}

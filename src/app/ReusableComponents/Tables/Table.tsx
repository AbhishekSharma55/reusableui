"use client";
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import {
  ChevronUpIcon,
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  LayoutGridIcon,
} from "lucide-react";
import { DragDropContext, Droppable, Draggable, DropResult } from "react-beautiful-dnd";

interface Post {
  [key: string]: any;
}

interface Column {
  key: string;
  label: string;
  visible: boolean;
}

type EnhancedPostTableProps = {
  tableName: string;
  apiEndpoint: string;
  isFilter: boolean;
  isSearch: boolean;
  isSort: boolean;
  isPagination: boolean;
  pagePerRecord: number;
  columnToogle: boolean;
};

export default function EnhancedPostTable({
  tableName,
  apiEndpoint,
  isFilter,
  isSearch,
  isSort,
  isPagination,
  pagePerRecord,
  columnToogle,
}: EnhancedPostTableProps) {
  const [results, setResults] = useState<Post[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [titleFilter, setTitleFilter] = useState("");
  const [bodyFilter, setBodyFilter] = useState("");
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [columns, setColumns] = useState<Column[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchResults(currentPage);
  }, [currentPage, pagePerRecord]);

  const fetchResults = async (page: number) => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `${apiEndpoint}?_page=${page}&_limit=${pagePerRecord}`
      );
      const data = await response.json();
      setResults(data);
      const totalCount = parseInt(response.headers.get("x-total-count") || "0", 10);
      setTotalPages(Math.ceil(totalCount / pagePerRecord));
      if (data.length > 0) {
        setColumns(
          Object.keys(data[0]).map((key) => ({
            key,
            label: key.toUpperCase(),
            visible: true,
          }))
        );
      }
    } catch (error) {
      console.error("Error fetching results:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSort = (column: string) => {
    if (!isSort) return; // Disable sorting if `isSort` is false

    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }

    const sorted = [...results].sort((a, b) => {
      if (a[column] < b[column]) return sortDirection === "asc" ? -1 : 1;
      if (a[column] > b[column]) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });
    setResults(sorted);
  };

  const toggleColumnVisibility = (key: string) => {
    if (!columnToogle) return; // Disable column toggle if `columnToogle` is false

    setColumns(
      columns.map((col) =>
        col.key === key ? { ...col, visible: !col.visible } : col
      )
    );
  };

  const applyFilter = () => {
    if (!isFilter) return; // Disable filtering if `isFilter` is false
    setCurrentPage(1);
    fetchResults(1);
  };

  const onDragEnd = (result: DropResult) => {
    if (!result.destination || !columnToogle) return;

    const newColumns = Array.from(columns);
    const [reorderedColumn] = newColumns.splice(result.source.index, 1);
    newColumns.splice(result.destination.index, 0, reorderedColumn);

    setColumns(newColumns);
  };

  return (
    <div className="w-full">
      <h1 className="text-center m-4 text-4xl">{tableName.toUpperCase()} PAGE</h1>
      <hr />
      <div className="container mx-auto p-4 max-w-6xl">
        {/* Filter/Search Section */}
        {isFilter && (
          <div className="flex flex-wrap gap-4 mb-4">
            <Input
              type="text"
              placeholder="Filter by title"
              value={titleFilter}
              onChange={(e) => setTitleFilter(e.target.value)}
              className="flex-grow"
            />
            <Input
              type="text"
              placeholder="Filter by body"
              value={bodyFilter}
              onChange={(e) => setBodyFilter(e.target.value)}
              className="flex-grow"
            />
            <Button onClick={applyFilter}>Apply Filter</Button>
          </div>
        )}

        {/* Column Toggle */}
        {columnToogle && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="ml-auto">
                <LayoutGridIcon className="h-4 w-4 mr-2" />
                Columns
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-[200px] p-2">
              <DragDropContext onDragEnd={onDragEnd}>
                <Droppable droppableId="columns">
                  {(provided) => (
                    <div {...provided.droppableProps} ref={provided.innerRef}>
                      {columns.map((col, index) => (
                        <Draggable key={col.key} draggableId={col.key} index={index}>
                          {(provided) => (
                            <DropdownMenuItem
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className="flex justify-between items-center gap-2"
                            >
                              <span>{col.label}</span>
                              <input
                                type="checkbox"
                                checked={col.visible}
                                onChange={() => toggleColumnVisibility(col.key)}
                              />
                            </DropdownMenuItem>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </DragDropContext>
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        {/* Table */}
        <Table className="min-w-full border border-gray-200 rounded shadow-md">
          <TableHeader className="bg-gray-200">
            <TableRow>
              {columns.filter((col) => col.visible).map((col) => (
                <TableHead
                  key={col.key}
                  onClick={() => handleSort(col.key)}
                  className={`cursor-pointer ${isSort ? "" : "pointer-events-none"}`}
                >
                  {col.label}
                  {isSort && sortColumn === col.key ? (
                    sortDirection === "asc" ? (
                      <ChevronUpIcon className="inline-block ml-1" />
                    ) : (
                      <ChevronDownIcon className="inline-block ml-1" />
                    )
                  ) : null}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {results.map((post, index) => (
              <TableRow key={index}>
                {columns.filter((col) => col.visible).map((col) => (
                  <TableCell key={col.key}>{post[col.key]}</TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {/* Pagination */}
        {isPagination && (
          <div className="flex justify-center items-center mt-4 space-x-2">
            <Button
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1 || isLoading}
              variant="outline"
              size="icon"
            >
              <ChevronLeftIcon className="h-4 w-4" />
            </Button>
            {[...Array(Math.min(5, totalPages))].map((_, index) => {
              const pageNumber = currentPage - 2 + index;
              if (pageNumber > 0 && pageNumber <= totalPages) {
                return (
                  <Button
                    key={pageNumber}
                    onClick={() => setCurrentPage(pageNumber)}
                    variant={currentPage === pageNumber ? "default" : "outline"}
                    disabled={isLoading}
                  >
                    {pageNumber}
                  </Button>
                );
              }
              return null;
            })}
            <Button
              onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages || isLoading}
              variant="outline"
              size="icon"
            >
              <ChevronRightIcon className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

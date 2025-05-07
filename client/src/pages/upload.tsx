import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { CSVReader } from "@/components/ui/csv-reader";
import { Button } from "@/components/ui/button";
import { Icons } from "@/components/icons";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

type FileType = "orders" | "ads";
type FileStatus = "pending" | "processing" | "success" | "error";

interface UploadedFile {
  id: number;
  filename: string;
  period: string;
  uploadDate: string;
  status: FileStatus;
  type: FileType;
}

export default function UploadPage() {
  const { toast } = useToast();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileData, setFileData] = useState<any[]>([]);
  const [month, setMonth] = useState<string>("Abril");
  const [year, setYear] = useState<string>("2025");
  const [fileType, setFileType] = useState<FileType>("orders");
  const [recentFiles, setRecentFiles] = useState<UploadedFile[]>([
    {
      id: 1,
      filename: "pedidosabril.csv",
      period: "Abril 2025",
      uploadDate: "01/05/2025",
      status: "success",
      type: "orders",
    },
    {
      id: 2,
      filename: "adsabril.csv",
      period: "Abril 2025",
      uploadDate: "01/05/2025",
      status: "success",
      type: "ads",
    },
    {
      id: 3,
      filename: "pedidosmarco.csv",
      period: "Março 2025",
      uploadDate: "02/04/2025",
      status: "success",
      type: "orders",
    },
  ]);

  const uploadMutation = useMutation({
    mutationFn: async ({ file, type, month, year }: { file: File; type: FileType; month: string; year: string }) => {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("type", type);
      formData.append("month", month);
      formData.append("year", year);

      const response = await apiRequest("POST", "/api/upload", formData);
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Arquivo processado com sucesso",
        description: `O arquivo ${selectedFile?.name} foi processado e está disponível para análise.`,
      });

      // Add to recent files
      setRecentFiles([
        {
          id: Date.now(),
          filename: selectedFile?.name || "arquivo.csv",
          period: `${month} ${year}`,
          uploadDate: new Date().toLocaleDateString("pt-BR"),
          status: "success",
          type: fileType,
        },
        ...recentFiles,
      ]);

      // Reset state
      setSelectedFile(null);
      setFileData([]);
    },
    onError: (error) => {
      toast({
        title: "Erro ao processar arquivo",
        description: `Ocorreu um erro: ${error.toString()}`,
        variant: "destructive",
      });
    },
  });

  const handleFileLoaded = (data: any[], file: File) => {
    setSelectedFile(file);
    setFileData(data.slice(0, 5)); // Just preview the first 5 rows
    
    // Try to determine file type from filename
    if (file.name.toLowerCase().includes("pedidos")) {
      setFileType("orders");
    } else if (file.name.toLowerCase().includes("ads")) {
      setFileType("ads");
    }
    
    toast({
      title: "Arquivo carregado",
      description: `${file.name} (${file.size} bytes)`,
    });
  };

  const handleFileError = (error: string) => {
    toast({
      title: "Erro ao ler arquivo",
      description: error,
      variant: "destructive",
    });
  };

  const processFile = () => {
    if (!selectedFile) {
      toast({
        title: "Nenhum arquivo selecionado",
        description: "Por favor, selecione um arquivo para processar.",
        variant: "destructive",
      });
      return;
    }

    uploadMutation.mutate({
      file: selectedFile,
      type: fileType,
      month,
      year,
    });
  };

  const handleDeleteFile = (id: number) => {
    setRecentFiles(recentFiles.filter((file) => file.id !== id));
    toast({
      title: "Arquivo removido",
      description: "O arquivo foi removido com sucesso.",
    });
  };

  const handleViewFile = (id: number) => {
    const file = recentFiles.find((file) => file.id === id);
    toast({
      title: "Visualizando arquivo",
      description: `${file?.filename} - ${file?.period}`,
    });
  };

  return (
    <div>
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Upload de Arquivos</CardTitle>
          <CardDescription>
            Carregue arquivos CSV para análise e processamento de dados.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* File Upload Area */}
            <div className="space-y-4">
              <CSVReader
                onFileLoaded={handleFileLoaded}
                onError={handleFileError}
                accept=".csv"
              />

              {fileData.length > 0 && (
                <Card>
                  <CardHeader className="py-3">
                    <CardTitle className="text-sm">
                      Preview: {selectedFile?.name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            {Object.keys(fileData[0]).slice(0, 4).map((key) => (
                              <TableHead key={key} className="whitespace-nowrap">
                                {key}
                              </TableHead>
                            ))}
                            <TableHead>...</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {fileData.map((row, i) => (
                            <TableRow key={i}>
                              {Object.values(row).slice(0, 4).map((value, j) => (
                                <TableCell key={j} className="whitespace-nowrap">
                                  {String(value)}
                                </TableCell>
                              ))}
                              <TableCell>...</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* File Configuration */}
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Configuração do Arquivo</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="month-year" className="block mb-1">
                      Mês de Referência
                    </Label>
                    <div className="grid grid-cols-2 gap-4">
                      <Select value={month} onValueChange={setMonth}>
                        <SelectTrigger>
                          <SelectValue placeholder="Mês" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectGroup>
                            <SelectLabel>Mês</SelectLabel>
                            <SelectItem value="Janeiro">Janeiro</SelectItem>
                            <SelectItem value="Fevereiro">Fevereiro</SelectItem>
                            <SelectItem value="Março">Março</SelectItem>
                            <SelectItem value="Abril">Abril</SelectItem>
                            <SelectItem value="Maio">Maio</SelectItem>
                            <SelectItem value="Junho">Junho</SelectItem>
                            <SelectItem value="Julho">Julho</SelectItem>
                            <SelectItem value="Agosto">Agosto</SelectItem>
                            <SelectItem value="Setembro">Setembro</SelectItem>
                            <SelectItem value="Outubro">Outubro</SelectItem>
                            <SelectItem value="Novembro">Novembro</SelectItem>
                            <SelectItem value="Dezembro">Dezembro</SelectItem>
                          </SelectGroup>
                        </SelectContent>
                      </Select>

                      <Select value={year} onValueChange={setYear}>
                        <SelectTrigger>
                          <SelectValue placeholder="Ano" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectGroup>
                            <SelectLabel>Ano</SelectLabel>
                            <SelectItem value="2023">2023</SelectItem>
                            <SelectItem value="2024">2024</SelectItem>
                            <SelectItem value="2025">2025</SelectItem>
                            <SelectItem value="2026">2026</SelectItem>
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label className="block mb-1">Tipo de Arquivo</Label>
                    <RadioGroup
                      value={fileType}
                      onValueChange={(value) => setFileType(value as FileType)}
                      className="grid grid-cols-2 gap-4"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="orders" id="type-orders" />
                        <Label htmlFor="type-orders">
                          Vendas (pedidosXXX.csv)
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="ads" id="type-ads" />
                        <Label htmlFor="type-ads">
                          Anúncios (adsXXX.csv)
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>

                  <Button 
                    className="w-full"
                    onClick={processFile}
                    disabled={!selectedFile || uploadMutation.isPending}
                  >
                    {uploadMutation.isPending ? (
                      <>
                        <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                        Processando...
                      </>
                    ) : (
                      "Processar Arquivo"
                    )}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Recent Uploads */}
          <div className="mt-6">
            <h3 className="text-base font-medium mb-3">Arquivos Recentes</h3>
            <div className="rounded-md border">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Arquivo</TableHead>
                      <TableHead>Período</TableHead>
                      <TableHead>Data Upload</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-center">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentFiles.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">
                          Nenhum arquivo processado recentemente.
                        </TableCell>
                      </TableRow>
                    ) : (
                      recentFiles.map((file) => (
                        <TableRow key={file.id}>
                          <TableCell>{file.filename}</TableCell>
                          <TableCell>{file.period}</TableCell>
                          <TableCell>{file.uploadDate}</TableCell>
                          <TableCell>
                            <div className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                              file.status === "success" 
                                ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100" 
                                : file.status === "processing"
                                ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100"
                                : file.status === "error"
                                ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100"
                                : "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-100"
                            }`}>
                              {file.status === "success" ? "Processado" 
                                : file.status === "processing" ? "Processando" 
                                : file.status === "error" ? "Erro" 
                                : "Pendente"}
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="text-primary hover:text-primary-foreground hover:bg-primary"
                              onClick={() => handleViewFile(file.id)}
                            >
                              <Icons.search className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="text-destructive hover:text-destructive-foreground hover:bg-destructive"
                              onClick={() => handleDeleteFile(file.id)}
                            >
                              <Icons.close className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

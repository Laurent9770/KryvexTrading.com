import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Shield,
  X,
  Upload,
  Camera,
  Save,
  ArrowLeft,
  RefreshCw
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import supabaseKYCService from "@/services/supabaseKYCService";

// KYC Interfaces
interface KYCLevel2Data {
  fullName: string;
  dateOfBirth: string;
  country: string;
  idType: 'passport' | 'drivers_license' | 'national_id';
  idNumber: string;
  frontFile?: File;
  backFile?: File;
  selfieFile?: File;
}

const KYCPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [identityData, setIdentityData] = useState<KYCLevel2Data>({
    fullName: '',
    dateOfBirth: '',
    country: '',
    idType: 'passport',
    idNumber: ''
  });
  const [filePreviews, setFilePreviews] = useState<{
    front?: string;
    back?: string;
    selfie?: string;
  }>({});
  const [isSubmittingKYC, setIsSubmittingKYC] = useState(false);

  const handleFileUpload = (field: 'frontFile' | 'backFile' | 'selfieFile', file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      setFilePreviews(prev => ({
        ...prev,
        [field.replace('File', '')]: e.target?.result as string
      }));
    };
    reader.readAsDataURL(file);

    setIdentityData(prev => ({
      ...prev,
      [field]: file
    }));
  };

  const removeFile = (field: 'frontFile' | 'backFile' | 'selfieFile') => {
    setFilePreviews(prev => ({
      ...prev,
      [field.replace('File', '')]: undefined
    }));

    setIdentityData(prev => ({
      ...prev,
      [field]: undefined
    }));
  };

  const handleSubmitIdentityVerification = async () => {
    if (!user?.id) return;

    // Validation
    if (!identityData.fullName || !identityData.dateOfBirth || !identityData.country || 
        !identityData.idNumber || !identityData.frontFile || !identityData.selfieFile) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields and upload required documents.",
        variant: "destructive"
      });
      return;
    }

    setIsSubmittingKYC(true);

    try {
      const { success, data, error } = await supabaseKYCService.createKYCSubmission({
        fullName: identityData.fullName,
        dateOfBirth: identityData.dateOfBirth,
        country: identityData.country,
        idType: identityData.idType,
        idNumber: identityData.idNumber,
        frontFile: identityData.frontFile,
        backFile: identityData.backFile,
        selfieFile: identityData.selfieFile
      });

      if (success) {
        toast({
          title: "KYC Submitted Successfully",
          description: "Your identity verification has been submitted for review.",
        });
        
        // Reset form
        setIdentityData({
          fullName: '',
          dateOfBirth: '',
          country: '',
          idType: 'passport',
          idNumber: ''
        });
        setFilePreviews({});
      } else {
        toast({
          title: "KYC Submission Failed",
          description: error || "Failed to submit KYC verification. Please try again.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error submitting KYC:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmittingKYC(false);
    }
  };

  const handleBack = () => {
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBack}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
          <h1 className="text-3xl font-bold text-foreground">Identity Verification</h1>
        </div>
        <p className="text-muted-foreground">
          Complete your identity verification to access all platform features.
        </p>

        {/* Identity Verification Form */}
        <Card className="border-0">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Identity Verification
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="p-4 bg-blue-500/10 rounded-lg">
              <p className="text-sm text-blue-600">
                Please provide your identity information and upload required documents.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="fullName">Full Name (as on ID)</Label>
                <Input
                  id="fullName"
                  value={identityData.fullName}
                  onChange={(e) => setIdentityData(prev => ({ ...prev, fullName: e.target.value }))}
                  placeholder="Enter your full name"
                />
              </div>
              
              <div>
                <Label htmlFor="dateOfBirth">Date of Birth</Label>
                <Input
                  id="dateOfBirth"
                  type="date"
                  value={identityData.dateOfBirth}
                  onChange={(e) => setIdentityData(prev => ({ ...prev, dateOfBirth: e.target.value }))}
                />
              </div>
              
              <div>
                <Label htmlFor="country">Country</Label>
                <Select value={identityData.country} onValueChange={(value) => setIdentityData(prev => ({ ...prev, country: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select country" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="US">United States</SelectItem>
                    <SelectItem value="CA">Canada</SelectItem>
                    <SelectItem value="GB">United Kingdom</SelectItem>
                    <SelectItem value="AU">Australia</SelectItem>
                    <SelectItem value="DE">Germany</SelectItem>
                    <SelectItem value="FR">France</SelectItem>
                    <SelectItem value="JP">Japan</SelectItem>
                    <SelectItem value="SG">Singapore</SelectItem>
                    <SelectItem value="HK">Hong Kong</SelectItem>
                    <SelectItem value="CH">Switzerland</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="idType">ID Type</Label>
                <Select value={identityData.idType} onValueChange={(value: any) => setIdentityData(prev => ({ ...prev, idType: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select ID type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="passport">Passport</SelectItem>
                    <SelectItem value="national_id">National ID</SelectItem>
                    <SelectItem value="drivers_license">Driver's License</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="md:col-span-2">
                <Label htmlFor="idNumber">ID Number</Label>
                <Input
                  id="idNumber"
                  value={identityData.idNumber}
                  onChange={(e) => setIdentityData(prev => ({ ...prev, idNumber: e.target.value }))}
                  placeholder="Enter your ID number"
                />
              </div>
            </div>
            
            {/* Document Upload */}
            <div className="space-y-4">
              <h4 className="font-semibold">Document Upload</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Front of ID */}
                <div className="space-y-2">
                  <Label>Front of ID *</Label>
                  <div className="border-2 border-dashed border-border rounded-lg p-4 text-center">
                    {filePreviews.front ? (
                      <div className="space-y-2">
                        <img src={filePreviews.front} alt="Front" className="w-full h-32 object-cover rounded" />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => removeFile('frontFile')}
                        >
                          <X className="w-4 h-4 mr-2" />
                          Remove
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <Upload className="w-8 h-8 mx-auto text-muted-foreground" />
                        <Input
                          type="file"
                          accept="image/*"
                          onChange={(e) => e.target.files?.[0] && handleFileUpload('frontFile', e.target.files[0])}
                          className="hidden"
                          id="frontFile"
                        />
                        <Label htmlFor="frontFile" className="cursor-pointer text-sm text-muted-foreground">
                          Click to upload
                        </Label>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Back of ID */}
                <div className="space-y-2">
                  <Label>Back of ID (Optional)</Label>
                  <div className="border-2 border-dashed border-border rounded-lg p-4 text-center">
                    {filePreviews.back ? (
                      <div className="space-y-2">
                        <img src={filePreviews.back} alt="Back" className="w-full h-32 object-cover rounded" />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => removeFile('backFile')}
                        >
                          <X className="w-4 h-4 mr-2" />
                          Remove
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <Upload className="w-8 h-8 mx-auto text-muted-foreground" />
                        <Input
                          type="file"
                          accept="image/*"
                          onChange={(e) => e.target.files?.[0] && handleFileUpload('backFile', e.target.files[0])}
                          className="hidden"
                          id="backFile"
                        />
                        <Label htmlFor="backFile" className="cursor-pointer text-sm text-muted-foreground">
                          Click to upload
                        </Label>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Selfie with ID */}
                <div className="space-y-2">
                  <Label>Selfie with ID *</Label>
                  <div className="border-2 border-dashed border-border rounded-lg p-4 text-center">
                    {filePreviews.selfie ? (
                      <div className="space-y-2">
                        <img src={filePreviews.selfie} alt="Selfie" className="w-full h-32 object-cover rounded" />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => removeFile('selfieFile')}
                        >
                          <X className="w-4 h-4 mr-2" />
                          Remove
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <Camera className="w-8 h-8 mx-auto text-muted-foreground" />
                        <Input
                          type="file"
                          accept="image/*"
                          onChange={(e) => e.target.files?.[0] && handleFileUpload('selfieFile', e.target.files[0])}
                          className="hidden"
                          id="selfieFile"
                        />
                        <Label htmlFor="selfieFile" className="cursor-pointer text-sm text-muted-foreground">
                          Click to upload
                        </Label>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
            
            <Button 
              onClick={handleSubmitIdentityVerification}
              disabled={isSubmittingKYC}
              className="w-full"
            >
              {isSubmittingKYC ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Submit for Review
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default KYCPage;

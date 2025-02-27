import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { AnimatedButton } from '@/components/ui/animated-button'
import { useToast } from '@/components/ui/use-toast'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { GradientBackground } from '@/components/GradientBackground'
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [registrationSuccess, setRegistrationSuccess] = useState(false)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    if (registrationSuccess) {
      const timer = setTimeout(() => setProgress(66), 500)
      const timer2 = setTimeout(() => setProgress(100), 1000)
      return () => {
        clearTimeout(timer)
        clearTimeout(timer2)
      }
    }
  }, [registrationSuccess])
  const router = useRouter()
  const { toast } = useToast()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if (response.ok) {
        // Store the token
        localStorage.setItem('token', data.token)
        localStorage.setItem('user', JSON.stringify(data.user))
        
        toast({
          title: "Success",
          description: "Logged in successfully",
        })
        
        // Redirect to home page
        router.push('/')
      } else {
        if (data.approvalStatus === 'PENDING') {
          // Show registration success state with pending approval message
          setRegistrationSuccess(true)
          setProgress(66)
          setTimeout(() => setProgress(100), 500)
          toast({
            title: "Account Pending",
            description: "Your account is awaiting administrator approval.",
          })
        } else {
          toast({
            variant: "destructive",
            title: "Error",
            description: data.message || "Failed to login",
          })
        }
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "An error occurred while logging in",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setProgress(33)

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, name }),
      })

      const data = await response.json()

      if (response.ok) {
        setRegistrationSuccess(true)
        toast({
          title: "Registration Successful",
          description: "Your account is pending administrator approval.",
        })
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: data.message || "Failed to register",
        })
        setProgress(0)
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "An error occurred while registering",
      })
      setProgress(0)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-8">
      <GradientBackground />
      <div className="relative px-12 py-6 rounded-lg bg-white/20 backdrop-blur-md border border-white/20 shadow-lg">
        <h1 className="text-4xl md:text-5xl font-bold text-white text-center">
          RFI Evaluation System
        </h1>
      </div>
      <Card className="w-[400px] bg-white/30 backdrop-blur-md shadow-lg border border-white/20">
        <CardHeader>
          <CardTitle>Welcome</CardTitle>
          <CardDescription>Access the RFI Evaluation System</CardDescription>
          <div className="mt-2 p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-3">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 6a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 6zm0 9a1 1 0 100-2 1 1 0 000 2z"
                clipRule="evenodd"
              />
            </svg>
            <div>
              <p className="text-sm font-semibold text-amber-800 mb-1">
                Important Security Notice
              </p>
              <p className="text-sm text-amber-700">
                While registering in the system, please create a unique password. Do not use your corporate credentials.
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="register">Register</TabsTrigger>
            </TabsList>
            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-4">
                {registrationSuccess && (
                  <Alert className="bg-amber-50 border-amber-200 mb-4">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 text-amber-600"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 6a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 6zm0 9a1 1 0 100-2 1 1 0 000 2z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <AlertTitle className="text-amber-800">Account Pending Approval</AlertTitle>
                    <AlertDescription className="text-amber-700">
                      Your account is currently awaiting administrator approval. You will be able to log in once your account has been approved.
                    </AlertDescription>
                  </Alert>
                )}
                <div className="space-y-2">
                  <Label htmlFor="login-email">Email</Label>
                  <Input
                    id="login-email"
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="bg-white border-gray-200"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="login-password">Password</Label>
                  <Input
                    id="login-password"
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="bg-white border-gray-200"
                  />
                </div>
                <div className="flex justify-center mt-6">
                  <AnimatedButton
                    type="submit"
                    text="Login"
                    loadingText="Logging in"
                    isLoading={isLoading}
                  />
                </div>
              </form>
            </TabsContent>
            <TabsContent value="register">
              {registrationSuccess ? (
                <div className="space-y-6">
                  <Alert className="bg-green-50 border-green-200">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 text-green-600"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <AlertTitle className="text-green-800">Registration Successful!</AlertTitle>
                    <AlertDescription className="text-green-700">
                      Your account has been created and is pending administrator approval. You will be able to log in once approved.
                    </AlertDescription>
                  </Alert>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>Registration Progress</span>
                      <span>{progress}%</span>
                    </div>
                    <Progress value={progress} className="h-2" />
                  </div>
                  
                  <div className="space-y-2 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <h4 className="font-semibold text-blue-900">What happens next?</h4>
                    <ul className="list-disc list-inside space-y-2 text-sm text-blue-800">
                      <li>Your registration will be reviewed by an administrator</li>
                      <li>After approval, you can log in using your credentials</li>
                    </ul>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleRegister} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="register-name">Full Name</Label>
                    <Input
                      id="register-name"
                      type="text"
                      placeholder="Enter your full name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      className="bg-white border-gray-200"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="register-email">Email</Label>
                    <Input
                      id="register-email"
                      type="email"
                      placeholder="Enter your email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="bg-white border-gray-200"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="register-password">Password</Label>
                    <Input
                      id="register-password"
                      type="password"
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="bg-white border-gray-200"
                    />
                  </div>
                  <div className="flex justify-center mt-6">
                    <AnimatedButton
                      type="submit"
                      text="Register"
                      loadingText="Registering"
                      isLoading={isLoading}
                    />
                  </div>
                </form>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
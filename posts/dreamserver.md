# Goals & Motivations

Building a web server can be easy or hard depending on the final goals. Of course, I cannot compete with projects such as NGINX or Apache on my own. Even if I could, it would take way too much time before I'm done. On the other hand, I'm not fond of "Toy" projects that do the bare minimum and that are easily replicated during a tutorial. The project has to be both impressive but not too big to allow me to move on and learn other stuff. How can this be achieved? 

## Features & Goals:

###### HTTP Request and Response Parser

- Receive raw requests
- Store raw requests as string
- Parse raw requests to HttpReq struct
- Return Error on invalid request format

###### Robust Logging

- Log all requests
- Follow NGINX format
- Events:
	- System Startup, Shutdown, Crashes
	- Requests
	- Errors and Exceptions
	- Resource usage
	- Security Issues
	- State Transitions

###### Immediate Planning:

- Design your ideal HTTP Request Response library API

###### General Features

- Static File Server
- Flexible Request, Response builder and serializer
- HTTPS
- Reverse Proxy (Forwarding)
- Custom Configuration File Format
###### Security Features

- Escape and sanitize paths

###### Performance Goals

- 20k requests per second on index.html

# Specifications

## Logging

All bespoke servers and reverse proxies have a solid logging mechanism. But first, what is logging?
Logging is the act of producing piece of data about one or more types of events in order to keep track of them for varying purposes.
You have to define:
- What kind of events do you want to track?
- In what format do you want to store them?
- Where do you want to store the logs?


## Configuration Format

Configuration:
- Worker Count
- Log Outputs per level
- Module inclusion
- Virtual Server Blocks:
	- Port
	- Hosts
	- Root File-system
- 

```nginx

server example.com {
    listen 80;
    hosts [ www.example.com ];
    access_log /var/log/dreamserver/requests.log;

    location /static/ {
        root /var/www/static;
    }

    location /api/ {
        proxy_pass http://localhost:8000;
    }
}

server example.com {
    listen 443 ssl;
    hosts [ www.example.com ];
    access_log /var/log/dreamserver/requests.log;

    ssl_certificate     cert.pem;
    ssl_certificate_key cert.key;

    location /static/ {
        root /var/www/static;
    }

    location /api/ {
        proxy_pass http://localhost:8000;
    }
}

```



### HTTP Request & Response Library API Design

```go

type HttpReq struct {
	// Request Line Informations
	Scheme  string
	Method  string
	Target  string
	Version string
	
	// Request Headers
	Headers map[string]string
	
	// Request Body
	Body    []byte
}

type HttpRes struct {
	// Status Line Informations
	Version       HttpVersion
	Status        StatusCode
	
	// Response Headers
	Headers       map[string]string
	
	// Response Body
	Body          []byte
}

```

### HTTP Client

Dreamserver is also a Reverse Proxy, and therefore needs a way to forward requests to third party servers. 

```go

// Let's imagine a proper http client

type RequestConfig struct {
	Query    map[string]string
	Headers  map[string]string
}

res, err := http_client.Get("djangoserver.com", 8000, "/admin", http_client.RequestConfig{
	Headers: map[string]string{
		"Bearer": "Token",
	}
})


if err != nil {
	// Handle Error
}

```
## What I've learned

- Modern HTTP clients are very secure and prevent you from sending risky payloads to the server. For instance, when you try to access the route /../../.. the client will collapse it so that you don't try to access forbidden content.
- Only privileged processes can have access to ports below 1024
- X-Forwarded-For allows the target server to see who the original client is.
- Via allows to track the proxy chain.
- The first line of a http request is called *request line*, and for response it is called *status line*
- When you call the *read()* syscall, it returns the count of bytes that have been read in your provided buffer. When it returns 0, it does not mean an error happened, it just means it hit *EOF*
- TCP Fast Open is an awesome performance booster that allows clients to send data right at the SYN phase of the handshake.
- You can tune your socket buffers and other kernel network parameters with *sysctl*, for example: *sysctl net.ipv4.tcp_rmem*
- You are really retarded and don't master the stdlibs of your languages. strings.Split() with spaces has to be used with care.
- When you receive an EOF while reading from a socket, it means that your peer has closed his connection.
- The meaning of EOF changes depending on when your connection is keep-alive or not.
- Proxy vs Gateway vs Tunnel
- The *Host* header is a HTTP/1.1 header, it is only for the request


###### Virtual Hosting

Virtual Hosting is a technique that web servers employ to host multiple domain names or websites on a single physical server.
This can be achieved either by:
- Name based Virtual Hosting (Host Header field on the HTTP Request)
- IP-based Virtual Hosting: (Destination IP address) This is more of a Legacy approach because in the past, SNI was not a thing, and the servers had no way to tell which domain was being targeted. 

###### SNI - Server Name Indication

When a client wants to access a resource on foo.com, it will just make the request to the domain. DNS will take care of resolving the domain to the corresponding IP address, but we can keep foo.com set in the Host header so that our HTTP server can know which website has to be served.

But what happens when you want to browse a website with SSL/TLS enabled?

###### SSL/TLS Certifications

Contrary to my misconception, a single SSL/TLS certification can be used for multiple domains, for instance, subdomains and different parent domains.
There are multiple types of certificates.
We have *Wildcard Certificates*, *Multi-Domain Certificates (SAN - Subject Alternative Name)*, *Multi-Domain Wildcard Certificatess*

## Questions

- What is Virtual Hosting
- What is IP aliasing
- What is SNI (Server Name Indication) 
- Are SSL/TLS certificates per domain or per IP?
- Is realloc faster than malloc? Why is resizing a byte sequence faster than allocating memory for a new one?
- Why can't the server send requests to the client?



###### Areas I am Retarded in

- When dealing with paths, I always forget to use standard lib path utilities that avoid me the hassle of struggling with accidental double slashes for instance.
- The standard library is your friend, read it and study it before writing code.
- I have hard time to split the work in digestible tasks.



## Implementation Logs

- Using os.Stat to get content size on HEAD request
- lstat, fstat and stat are useful syscalls to cheaply examine file metadata.
- Parse HTTP according to the specification
- I avoided to set a default server avoid debugging sessions, I prefer explicitness.

###### Incremental HTTP parsing

TCP is a stream based protocol.

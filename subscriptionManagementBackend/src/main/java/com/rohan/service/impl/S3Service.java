package com.rohan.service.impl;

import java.io.IOException;
import java.time.Duration;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.DeleteObjectRequest;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;
import software.amazon.awssdk.services.s3.presigner.model.GetObjectPresignRequest;

@Service
@RequiredArgsConstructor
@Slf4j
public class S3Service {
    private final S3Client s3Client;
    private final S3Presigner s3Presigner;

    @Value("${aws.s3.bucket-name}")
    private String bucket;

    @Value("${aws.s3.region}")
    private String region;
    public String uploadPlanImage(MultipartFile file) {
        return upload(file, "plans/");
    }

    public String uploadAvatar(MultipartFile file) {
        return upload(file, "avatars/");
    }

    public String getPresignedUrl(String key) {
        GetObjectPresignRequest req = GetObjectPresignRequest.builder()
                .signatureDuration(Duration.ofHours(1))
                .getObjectRequest(r -> r.bucket(bucket).key(key))
                .build();
        return s3Presigner.presignGetObject(req).url().toString();
    }

    public void delete(String key) {
        s3Client.deleteObject(DeleteObjectRequest.builder().bucket(bucket).key(key).build());
        log.info("Deleted S3 object key={}", key);
    }

    private String upload(MultipartFile file, String prefix) {
        String originalName = file.getOriginalFilename() != null
                ? file.getOriginalFilename() : "file";
        String key = prefix + UUID.randomUUID() + "_" + originalName;
        try {
            s3Client.putObject(
                    PutObjectRequest.builder()
                            .bucket(bucket)
                            .key(key)
                            .contentType(file.getContentType())
                            .build(),
                    RequestBody.fromBytes(file.getBytes())
            );
            log.info("Uploaded to S3 key={}", key);
        } catch (IOException e) {
            throw new RuntimeException("S3 upload failed for key=" + key, e);
        }
        return "https://" + bucket + ".s3." + region + ".amazonaws.com/" + key;
    }
}

